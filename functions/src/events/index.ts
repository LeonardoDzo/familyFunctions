import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as _ from 'underscore'

export const onAddMemberEvent = functions.database.ref("/events/{id}/members/{idMember}").onCreate(async memberSnap =>{
   let id = memberSnap.params!.id;
   let idMember = memberSnap.params!.idMember;
    await admin.database().ref(`/users/${idMember}/events/${id}`).set(true);
    await sendNotificationAddEvent(id,idMember);
});

export const onRemoveMemberEvent = functions.database.ref("/events/{id}/members/{idMember}").onDelete(async memberSnap =>{
   let id = memberSnap.params!.id;
   let idMember = memberSnap.params!.idMember;
    await admin.database().ref(`/users/${idMember}/events/${id}`).remove();
    await sendNotificationRemoveEvent(id, idMember,null);
});

export const onRemoveEvent = functions.database.ref("/events/{id}").onDelete(async eventSnap =>{
    let id = eventSnap.params!.id;
    let event = eventSnap.data.val();
    if(event.hasOwnProperty("admins")){
        await _.each(Object.keys(event.admins), async adminKey => {
             await admin.database().ref(`/users/${adminKey}/events/${id}`).remove();
             await sendNotificationRemoveEvent(id, adminKey,event);
        });
    }
    if(event.hasOwnProperty("members")){
        await _.each(Object.keys(event.members), async user => {
             await admin.database().ref(`/users/${user}/events/${id}`).remove();
             await sendNotificationRemoveEvent(id, user,event);
        });
    }
});

async function sendNotificationAddEvent(eventId: string, userAdded: string){
    await admin.database().ref(`/users/${userAdded}`).once("value",async userSnap =>{
       let user = userSnap.val();
       await admin.database().ref(`/events/${eventId}`).once("value", async eventSnap =>{
           let event = eventSnap.val();
           let payload = {
               notification: {
                   title: `Nuevo Evento:`,
                   body: `Se te agregó al evento: ${event.title || "Nuevo Evento"}`
               },
               data: {
                   event: eventId,
                   user: userAdded
               }
           }
           let ref = await admin.database().ref("notifications").push();
           await ref.set({...payload, user: userAdded});
           if(ref != null){
               admin.database().ref(`/users/${userAdded}/notifications/${ref.key}`).set(false);
           }
           if(user.hasOwnProperty("tokens")){
               _.each(Object.keys(user.tokens), async token =>{
                   await admin.messaging().sendToDevice(token,payload).then(success =>{
                       console.log("notifier-success: \n", success);
                   }).catch(error =>{
                       console.log("notifier-error: \n", error);
                   })
               });
           }
       });
    });
}

async function sendNotificationRemoveEvent(eventId: string, userAdded: string, eventData: any){
    await admin.database().ref(`/users/${userAdded}`).once("value",async userSnap =>{
       let user = userSnap.val();
       await admin.database().ref(`/events/${eventId}`).once("value", async eventSnap =>{
           let event = eventSnap.val();
           if(eventSnap != null){
               let payload = {
                   notification: {
                       title: `Aviso de evento:`,
                       body: `Se te eliminó del evento: ${event.title || "Nuevo Evento"}`
                   },
                   data: {
                       event_remove: eventId,
                       user: userAdded
                   }
               }
               let ref = await admin.database().ref("notifications").push();
               await ref.set({...payload, user: userAdded});
               if(ref != null){
                   admin.database().ref(`/users/${userAdded}/notifications/${ref.key}`).set(false);
               }
               if(user.hasOwnProperty("tokens")){
                   _.each(Object.keys(user.tokens), async token =>{
                       await admin.messaging().sendToDevice(token,payload).then(success =>{
                           console.log("notifier-success: \n", success);
                       }).catch(error =>{
                           console.log("notifier-error: \n", error);
                       })
                   });
               }
           }else{
               let payload = {
                   notification: {
                       title: `Aviso de evento:`,
                       body: `Se te eliminó del evento: ${eventData.title || "Nuevo Evento"}`
                   },
                   data: {
                       event_remove: eventId,
                       user: userAdded
                   }
               }
               let ref = await admin.database().ref("notifications").push();
               await ref.set({...payload, user: userAdded});
               if(ref != null){
                   admin.database().ref(`/users/${userAdded}/notifications/${ref.key}`).set(false);
               }
               if(user.hasOwnProperty("tokens")){
                   _.each(Object.keys(user.tokens), async token =>{
                       await admin.messaging().sendToDevice(token,payload).then(success =>{
                           console.log("notifier-success: \n", success);
                       }).catch(error =>{
                           console.log("notifier-error: \n", error);
                       })
                   });
               }
           }
       });
    });
}