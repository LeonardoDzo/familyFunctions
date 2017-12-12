import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

export interface Family {
 $key: string;
 admin?: Admins;
 imageProfilePath: string;
 members?: FamilyMembers;
 name: string;
 photoUrl: string;
}

export interface FamilyMembers {
 [user: string]: boolean;
}

export interface Admins {
 [user: string]: boolean;
}


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
    onMemberRemoved(id, members, removedMembers),
    onMemberAdded(id, members, addedMembers)
  ]);
});


async function onMemberRemoved(famId: string, currentMembers: FamilyMembers, members: string[]){
  console.log('removedMembers', members);
  await Promise.all(members
    .map(member => admin.database().ref(`/users/${member}/families/${famId}`).remove()));
}

async function onMemberAdded(famId: string, currentMembers: FamilyMembers, members: string[]){
  console.log('addedMembers', members);
  await Promise.all(members
    .map(member => admin.database().ref(`/users/${member}/families/${famId}`).set(true)));
  // let fam : Family = (await promiseOnce('/families/'+famId, 'value')).val();
  // await notifyMembersAdded(fam, famId, members);
}

export const listener = functions.database.ref('families/{id}/').onCreate(async event => {
   let fam: Family = event.data.val();
   let id = event.params.id
   let usersIds = Object.keys(fam.members || {});
   await Promise.all(usersIds.map(userid => {
     return admin.database().ref(`/users/${userid}/families/${id}`).set(true);
   }));
});
