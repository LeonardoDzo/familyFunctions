import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as _ from 'underscore'

export const OnCreateChat = functions.database.ref("/groups/{id}").onCreate( async group =>{
    let id = group.params!.id;
    let gData = group.data.val();
    if(gData.hasOwnProperty("familyId")){
        await admin.database().ref(`/families/${gData.familyId}/groups/${id}`).set(true);
    }
});

export const OnDeleteChat = functions.database.ref("/groups/{id}").onDelete(async group =>{
    let id = group.params!.id;
    let data = group.data.previous.val();
    if(data.hasOwnProperty("familyId")){
        await admin.database().ref(`/families/${data.familyId}/groups/${id}`).remove();
    }
});

export const OnCreateMessage = functions.database.ref("/messages/{id}").onCreate(async data=>{
    let id = data.params!.id;
    let message = data.data.val();
    await admin.database().ref(`/groups/${message.groupId}/messages/${id}`).set(message.timestamp);
    await admin.database().ref(`/groups/${message.groupId}/lastMessage`).set(id);
    await admin.database().ref(`/groups/${message.groupId}/members/${message.remittent}`).set(message.timestamp);
    await admin.database().ref(`/users/${message.remittent}`).once("value", async remittentSnap =>{
        let remittent = remittentSnap.val();
        await admin.database().ref(`/groups/${message.groupId}`).once("value", async groupSnap =>{
            let group = groupSnap.val();
            if(group.isGroup == true){
                let members = Object.keys(group.members).filter(item => item != message.remittent);
                await _.each(members, async idUser => {
                    await admin.database().ref(`/users/${idUser}`).once("value",userSnap =>{
                        let user = userSnap.val();
                        let payload = {
                            notification: {
                                title: `Nuevo Mensaje en ${group.title}:`,
                                body: `${remittent.name}: ${message.text}`
                            },
                            data: {
                                type: '0',
                                chat: message.groupId,
                                familyId: group.familyId
                            }
                        }
                        if(user.hasOwnProperty("tokens")){
                            let tokens = Object.keys(user.tokens);
                            tokens.forEach(item => admin.messaging().sendToDevice(item,payload)
                                .then(success => console.log(success))
                                .catch(error => console.log(error))
                            );
                        }
                    });
                });
            }else{
                let members = Object.keys(group.members).filter(item => item != message.remittent);
                await _.each(members, async idUser => {
                    await admin.database().ref(`/users/${idUser}`).once("value",userSnap =>{
                        let user = userSnap.val();
                        let payload = {
                            notification: {
                                title: `Nuevo Mensaje:`,
                                body: `${remittent.name}: ${message.text}`
                            },
                            data: {
                                chat: message.groupId,
                                familyId: group.familyId
                            }
                        }
                        if(user.hasOwnProperty("tokens")){
                            let tokens = Object.keys(user.tokens);
                            tokens.forEach(item => admin.messaging().sendToDevice(item,payload)
                                .then(success => console.log(success))
                                .catch(error => console.log(error))
                            );
                        }
                    });
                });
            }
        });
    });
});

export const onRemoveMemberChat = functions.database.ref("/groups/{idGroup}/members/{idMember}").onDelete(async snap=>{
    let idMember = snap.params!.idMember;
    let idGroup = snap.params!.idGroup;
    await admin.database().ref(`/groups/${idGroup}`).once("value", async groupSnap =>{
        let group = groupSnap.val();
        await admin.database().ref(`/users/${idMember}`).once("value", async userSnap =>{
            let user = userSnap.val();
            let payload = {
                notification: {
                    title: "Se te eliminó de un chat.",
                    body: `Has sido eliminado del grupo ${group.title}`
                },
                data: {
                    chat: idGroup,
                    familyId: group.familyId
                }
            }
            if(user.hasOwnProperty("tokens")){
                let tokens = Object.keys(user.tokens);
                await _.each(tokens, token =>{
                    admin.messaging().sendToDevice(token,payload).then(success => {
                        console.log("Success Notifier: ", payload)
                    }).catch(error =>{
                        console.log("========== error notifier=========== \n",error);
                    });
                });
            }
        });
    });
});

export const onAddMemberChat = functions.database.ref("/groups/{idGroup}/members/{idMember}").onCreate(async snap=>{
    let idMember = snap.params!.idMember;
    let idGroup = snap.params!.idGroup;
    await admin.database().ref(`/groups/${idGroup}`).once("value", async groupSnap =>{
        let group = groupSnap.val();
        if(group.isGroup == true){
            await admin.database().ref(`/users/${idMember}`).once("value", async userSnap =>{
                let user = userSnap.val();
                let payload = {
                    notification: {
                        title: "Has sido añadido a un chat.",
                        body: `Has sido añadido al grupo ${group.title}`
                    },
                    data: {
                        chat: idGroup,
                        familyId: group.familyId
                    }
                }
                if(user.hasOwnProperty("tokens")){
                    let tokens = Object.keys(user.tokens);
                    await _.each(tokens, token =>{
                        admin.messaging().sendToDevice(token,payload).then(success => {
                            console.log("Success Notifier: ", payload)
                        }).catch(error =>{
                            console.log("========== error notifier=========== \n",error);
                        });
                    });
                }
            });
        }
    });
});

export const onReadChat = functions.database.ref('/groups/{groupId}/members/{memberId}')
    .onUpdate(async snap => {
        let memberId = snap.params!.memberId;
        let groupId = snap.params!.groupId;
        let timestamp = snap.data.val();
        let reads = await admin.database().ref(`/groups/${groupId}/members`).once('value');
        let fartherRead = _.min(_.values(reads));
        if (timestamp > fartherRead) return; // aun hay mensajes sin leer
        let messages = await admin.database().ref('/messages')
            .orderByChild("groupId")
            .equalTo(groupId)
            .once('value');
        let ps: Promise<any>[] = [];
        _.mapObject(messages, (message, id) => {
            console.log(id, message.timestamp);
            if (message.timestamp < fartherRead) 
                ps.push(admin.database().ref('/messages/' + id).remove());
        });
        await Promise.all(ps);
    });