import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import {isNullOrUndefined} from "util";
import * as _ from 'underscore';

export interface Family {
 $key: string;
 admin?: Admins;
 imageProfilePath: string;
 members?: FamilyMembers;
 name: string;
 photoURL: string;
}

export interface FamilyMembers {
 [user: string]: boolean;
}

export interface Admins {
 [user: string]: boolean;
}

export const listener = functions.database.ref('families/{id}/').onCreate(async event => {
   let fam: Family = event.data.val();
   let id = event.params!.id
   let usersIds = Object.keys(fam.members || {});
    let members = fam.members;
    let group = {
        familyId: id,
        title: fam.name,
        coverPhoto: fam.photoURL,
        createdAt: Date.now(),
        members: members
    }
    await admin.database().ref(`/groups/${id}`).set(group);
    //await admin.database().ref(`/families/${id}/groups/${id}`).set(true);
   await Promise.all(usersIds.map(userid => {
     return admin.database().ref(`/users/${userid}/families/${id}`).set(true);
   }));
});

export const ChangeFamilyPhoto = functions.database.ref("families/{id}/photoURL/{url}").onWrite(
    async data =>{
        let id = data.params.id
        let url = data.params.url
        await admin.database().ref(`/groups/${id}/coverPhoto`).set(url);
    });

export const ChangeFamilyName = functions.database.ref("families/{id}/name/{name}").onWrite(
    async data =>{
        let id = data.params.id;
        let name = data.params.name;
        await admin.database().ref(`/groups/${id}/title`).set(name);
    });
export const familyMembersChanged = functions.database.ref('/families/{id}/members')
    .onWrite(async event => {
        let id = event.params!.id;
        let members : FamilyMembers = event.data.val() || {};
        let oldMembers : FamilyMembers = event.data.previous.val() || {};
        let membersArray = Object.keys(members);
        let oldMembersArray = Object.keys(oldMembers);
        let removedMembers = oldMembersArray.filter(userId => members[userId] == null);
        let addedMembers = membersArray.filter(userId => oldMembers[userId] == null);
        await Promise.all([
            onMemberRemoved(id, membersArray, removedMembers),
            onMemberAdded(id, membersArray, addedMembers)
        ]);
    });

async function onMemberRemoved(famId: string, currentMembers: string[], members: string[]){
    await Promise.all(members
        .map(member => {
            admin.database().ref(`/users/${member}/families/${famId}`).remove(isRemove =>{
                if(isNullOrUndefined(isRemove)){
                    admin.database().ref(`/groups/${famId}/members/${member}`).remove(async data =>{
                        if(isNullOrUndefined(data)){
                            admin.database().ref(`/families/${famId}`).once("value", snapFam =>{
                                let fam = snapFam.val();
                                _.each(members,userId =>{
                                    console.log("userId",userId)
                                    admin.database().ref(`/users/${userId}`).once("value", snapUsr =>{
                                        console.log(snapUsr.val());
                                        let userRemoved = snapUsr.val();
                                        if(userRemoved.hasOwnProperty("tokens")){
                                            let userToken = Object.keys(userRemoved.tokens);
                                            _.each(userToken, token =>{
                                                let payload = {
                                                    notification:{
                                                        title: `Se te eliminó de la familia ${fam.name}`
                                                    },
                                                    data:{
                                                        family: fam.$key,
                                                        user: userId
                                                    }
                                                }
                                                admin.messaging().sendToDevice(token,payload).then(response =>{
                                                    console.log("======  success notifier =====");
                                                    console.log(response)
                                                    console.log("======  success =====");
                                                }).catch(error =>{
                                                    console.log("======  error notifier =====");
                                                    console.log(error)
                                                    console.log("======  error =====");
                                                });
                                            });
                                        }
                                        _.each(currentMembers,userId =>{
                                            admin.database().ref(`/users/${userId}`).once("value", snapUsr =>{
                                                let user = snapUsr.val();
                                                if(user.hasOwnProperty("tokens")){
                                                    let userToken = Object.keys(user.tokens);
                                                    _.each(userToken, token =>{
                                                        let payload = {
                                                            notification:{
                                                                title: fam.name,
                                                                body: `Se eliminó a ${userRemoved.name} de la familia ${fam.name}`
                                                            },
                                                            data:{
                                                                family: famId,
                                                                user: userId
                                                            }
                                                        }
                                                        console.log("==Payload==: ",payload);
                                                        admin.messaging().sendToDevice(token,payload).then(response =>{
                                                            console.log("======  success notifier =====");
                                                            console.log(response)
                                                            console.log("======  success =====");
                                                        }).catch(error =>{
                                                            console.log("======  error notifier =====");
                                                            console.log(error)
                                                            console.log("======  error =====");
                                                        });
                                                    });
                                                }
                                            });
                                        });
                                    });
                                });
                            });
                        }
                    });
                }
            });
        }));
}

async function onMemberAdded(famId: string, currentMembers: FamilyMembers, members: string[]){
    console.log('addedMembers', members);
    await Promise.all(members
        .map(async member => {
            await admin.database().ref(`/users/${member}/families/${famId}`).set(true)
            await admin.database().ref(`/groups/${famId}/members/${member}`).set(true)
            await admin.database().ref(`/families/${famId}`).once("value", snapFam =>{
                let fam = snapFam.val();
                _.each(members,userId =>{
                    console.log("userId",userId)
                    admin.database().ref(`/users/${userId}`).once("value", snapUsr =>{
                        console.log(snapUsr.val());
                        let userRemoved = snapUsr.val();
                        if(userRemoved.hasOwnProperty("tokens")){
                            let userToken = Object.keys(userRemoved.tokens);
                            _.each(userToken, token =>{
                                let payload = {
                                    notification:{
                                        title: `Se te agregó de la familia ${fam.name}`
                                    },
                                    data:{
                                        family: fam.$key,
                                        user: userId
                                    }
                                }
                                admin.messaging().sendToDevice(token,payload).then(response =>{
                                    console.log("======  success notifier =====");
                                    console.log(response)
                                    console.log("======  success =====");
                                }).catch(error =>{
                                    console.log("======  error notifier =====");
                                    console.log(error)
                                    console.log("======  error =====");
                                });
                            });
                        }
                        _.each(currentMembers,userId =>{
                            admin.database().ref(`/users/${userId}`).once("value", snapUsr =>{
                                let user = snapUsr.val();
                                if(user.hasOwnProperty("tokens")){
                                    let userToken = Object.keys(user.tokens);
                                    _.each(userToken, token =>{
                                        let payload = {
                                            notification:{
                                                title: fam.name,
                                                body: `Se agregó a ${userRemoved.name} de la familia ${fam.name}`
                                            },
                                            data:{
                                                family: famId,
                                                user: userId
                                            }
                                        }
                                        console.log("==Payload==: ",payload);
                                        admin.messaging().sendToDevice(token,payload).then(response =>{
                                            console.log("======  success notifier =====");
                                            console.log(response)
                                            console.log("======  success =====");
                                        }).catch(error =>{
                                            console.log("======  error notifier =====");
                                            console.log(error)
                                            console.log("======  error =====");
                                        });
                                    });
                                }
                            });
                        });
                    });
                });
            });
        }));
    // let fam : Family = (await promiseOnce('/families/'+famId, 'value')).val();
    // await notifyMembersAdded(fam, famId, members);
}