import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

export const onAddMemberEvent = functions.database.ref("/events/{id}/members/{idMember}").onCreate(async memberSnap =>{
   let id = memberSnap.params!.id;
   let idMember = memberSnap.params!.idMember;
   await admin.database().ref(`/events/${id}/members/${idMember}`).once("value",async snap =>{
       let member = snap.val();
       await admin.database().ref(`/users/${member.id}/events/${id}`).set(true);
   });
});

export const onRemoveMemberEvent = functions.database.ref("/events/{id}/members/{idMember}").onDelete(async memberSnap =>{
   let id = memberSnap.params!.id;
   let idMember = memberSnap.params!.idMember;
    await admin.database().ref(`/users/${idMember}/events/${id}`).remove();
});

