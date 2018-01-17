import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as _ from 'underscore'

export const onAddMemberEvent = functions.database.ref("/events/{id}/members/{idMember}").onCreate(async memberSnap =>{
   let id = memberSnap.params!.id;
   let idMember = memberSnap.params!.idMember;
    await admin.database().ref(`/users/${idMember}/events/${id}`).set(true);
    await admin.database().ref(`/events/${id}`).once("value", async eventSnap =>{
        let event = eventSnap.val();
        let payload = {
            notification: {
                title: `Nuevo Evento:`,
                body: `Se te agregó al evento: ${event.title || "Nuevo Evento"}`
            },
            data: {
                event: id,
                timestamp: Date.now() + ''
            }
        }
        await sendNotificationAddEvent(id,idMember,payload);
    });
});

export const onRemoveMemberEvent = functions.database.ref("/events/{id}/members/{idMember}").onDelete(async memberSnap =>{
   let id = memberSnap.params!.id;
   let idMember = memberSnap.params!.idMember;
    await admin.database().ref(`/users/${idMember}/events/${id}`).remove();
    await admin.database().ref(`/events/${id}`).once("value", async eventSnap =>{
        let event = eventSnap.val();
        let payload = {
            notification: {
                title: `Evento:`,
                body: `Se te agregó a un nuevo evento: ${event.title || "Nuevo Evento"}`
            },
            data: {
                event: id,
                deleted: false,
                timestamp: Date.now()
            }
        }
        await sendNotificationRemoveEvent(id, idMember,null,payload);
    });
});

export const onRemoveEvent = functions.database.ref("/events/{id}").onDelete(async eventSnap =>{
    let id = eventSnap.params!.id;
    let event = eventSnap.data.val();
    if(event.hasOwnProperty("admins")){
        await _.each(Object.keys(event.admins), async adminKey => {
             await admin.database().ref(`/users/${adminKey}/events/${id}`).remove();
            let payload = {
                notification: {
                    title: `Evento ${event.title || "info" }:`,
                    body: `Se eliminó el evento: ${event.title || "Nuevo Evento"}`
                },
                data: {
                    event: id,
                    deleted: true,
                    title: event.title,
                    timestamp: Date.now()
                }
            }
             await sendNotificationRemoveEvent(id, adminKey,event, payload);
        });
    }
    if(event.hasOwnProperty("members")){
        await _.each(Object.keys(event.members), async user => {
             await admin.database().ref(`/users/${user}/events/${id}`).remove();
            let payload = {
                notification: {
                    title: `Evento ${event.title || "info" }:`,
                    body: `Se eliminó el evento: ${event.title || "Nuevo Evento"}`
                },
                data: {
                    event: id,
                    title: event.title,
                    timestamp: Date.now()
                }
            }
            await sendNotificationRemoveEvent(id, user,event, payload);
        });
    }
});

async function sendNotificationAddEvent(eventId: string, userAdded: string, payload: any){
    await admin.database().ref(`/users/${userAdded}`).once("value",async userSnap =>{
       let user = userSnap.val();
       await admin.database().ref(`/events/${eventId}`).once("value", async eventSnap =>{
           let event = eventSnap.val();
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

async function sendNotificationRemoveEvent(eventId: string, userAdded: string, eventData: any, payload: any){
    await admin.database().ref(`/users/${userAdded}`).once("value",async userSnap =>{
       let user = userSnap.val();
       await admin.database().ref(`/events/${eventId}`).once("value", async eventSnap =>{
           let event = eventSnap.val();
           if(eventSnap != null){
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