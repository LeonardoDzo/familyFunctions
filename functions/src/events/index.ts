import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as _ from 'underscore'

export const eventMembersChanged = functions.database.ref('/events/{id}/members')
.onWrite(async event => {
  let id = event.params!.id;
  let members = event.data.val() || [];

  let oldMembers = event.data.previous.val() || [];

  let samemembers = _.intersection(oldMembers, members)
  
  let removedMembers =  _.difference(oldMembers, samemembers)
  let addedMembers = _.difference(members, samemembers)
  await Promise.all([
    onMemberRemoved(id, members, removedMembers),
    onMemberAdded(id, members, addedMembers)
  ]);
});

async function onMemberRemoved(famId: string, currentMembers: FamilyMembers, members: string[]){
  await Promise.all(members
    .map(member => admin.database().ref(`/users/${member}/events/${famId}`).remove()));
}

async function onMemberAdded(famId: string, currentMembers: FamilyMembers, members: string[]){
  await Promise.all(members
    .map(member => admin.database().ref(`/users/${member}/events/${famId}`).set(true)));
}

export const listenerEvent = functions.database.ref('events/{id}/').onCreate(async event => {
   let events = event.data.val();
   let id = event.params.id
   console.log('====================================');
   console.log(events);
   console.log('====================================');
   let usersIds = Object.keys(events.members || {});
   await Promise.all(usersIds.map(userid => {
     return admin.database().ref(`/users/${userid}/events/${id}`).set(true);
   }));
});
