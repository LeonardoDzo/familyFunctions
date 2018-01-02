(function(e, a) { for(var i in a) e[i] = a[i]; }(this, /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 3);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = require("firebase-functions");

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = require("firebase-admin");

/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = require("underscore");

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const functions = __webpack_require__(0);
const admin = __webpack_require__(1);
admin.initializeApp(functions.config().firebase);
__export(__webpack_require__(4));
__export(__webpack_require__(6));
__export(__webpack_require__(7));


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const functions = __webpack_require__(0);
const admin = __webpack_require__(1);
const util_1 = __webpack_require__(5);
const _ = __webpack_require__(2);
exports.listener = functions.database.ref('families/{id}/').onCreate((event) => __awaiter(this, void 0, void 0, function* () {
    let fam = event.data.val();
    let id = event.params.id;
    let usersIds = Object.keys(fam.members || {});
    let members = fam.members;
    let group = {
        familyId: id,
        title: fam.name,
        coverPhoto: fam.photoURL,
        createdAt: Date.now(),
        members: members
    };
    yield admin.database().ref(`/groups/${id}`).set(group);
    //await admin.database().ref(`/families/${id}/groups/${id}`).set(true);
    yield Promise.all(usersIds.map(userid => {
        return admin.database().ref(`/users/${userid}/families/${id}`).set(true);
    }));
}));
exports.ChangeFamilyPhoto = functions.database.ref("families/{id}/photoURL/{url}").onWrite((data) => __awaiter(this, void 0, void 0, function* () {
    let id = data.params.id;
    let url = data.params.url;
    yield admin.database().ref(`/groups/${id}/coverPhoto`).set(url);
}));
exports.ChangeFamilyName = functions.database.ref("families/{id}/name/{name}").onWrite((data) => __awaiter(this, void 0, void 0, function* () {
    let id = data.params.id;
    let name = data.params.name;
    yield admin.database().ref(`/groups/${id}/title`).set(name);
}));
exports.familyMembersChanged = functions.database.ref('/families/{id}/members')
    .onWrite((event) => __awaiter(this, void 0, void 0, function* () {
    let id = event.params.id;
    let members = event.data.val() || {};
    let oldMembers = event.data.previous.val() || {};
    let membersArray = Object.keys(members);
    let oldMembersArray = Object.keys(oldMembers);
    let removedMembers = oldMembersArray.filter(userId => members[userId] == null);
    let addedMembers = membersArray.filter(userId => oldMembers[userId] == null);
    yield Promise.all([
        onMemberRemoved(id, membersArray, removedMembers),
        onMemberAdded(id, membersArray, addedMembers)
    ]);
}));
function onMemberRemoved(famId, currentMembers, members) {
    return __awaiter(this, void 0, void 0, function* () {
        yield Promise.all(members
            .map(member => {
            admin.database().ref(`/users/${member}/families/${famId}`).remove(isRemove => {
                if (util_1.isNullOrUndefined(isRemove)) {
                    admin.database().ref(`/groups/${famId}/members/${member}`).remove((data) => __awaiter(this, void 0, void 0, function* () {
                        if (util_1.isNullOrUndefined(data)) {
                            admin.database().ref(`/families/${famId}`).once("value", snapFam => {
                                let fam = snapFam.val();
                                _.each(members, userId => {
                                    console.log("userId", userId);
                                    admin.database().ref(`/users/${userId}`).once("value", snapUsr => {
                                        console.log(snapUsr.val());
                                        let userRemoved = snapUsr.val();
                                        if (userRemoved.hasOwnProperty("tokens")) {
                                            let userToken = Object.keys(userRemoved.tokens);
                                            _.each(userToken, token => {
                                                let payload = {
                                                    notification: {
                                                        title: `Se te eliminó de la familia ${fam.name}`
                                                    },
                                                    data: {
                                                        family: fam.$key,
                                                        user: userId
                                                    }
                                                };
                                                admin.messaging().sendToDevice(token, payload).then(response => {
                                                    console.log("======  success notifier =====");
                                                    console.log(response);
                                                    console.log("======  success =====");
                                                }).catch(error => {
                                                    console.log("======  error notifier =====");
                                                    console.log(error);
                                                    console.log("======  error =====");
                                                });
                                            });
                                        }
                                        _.each(currentMembers, userId => {
                                            admin.database().ref(`/users/${userId}`).once("value", snapUsr => {
                                                let user = snapUsr.val();
                                                if (user.hasOwnProperty("tokens")) {
                                                    let userToken = Object.keys(user.tokens);
                                                    _.each(userToken, token => {
                                                        let payload = {
                                                            notification: {
                                                                title: fam.name,
                                                                body: `Se eliminó a ${userRemoved.name} de la familia ${fam.name}`
                                                            },
                                                            data: {
                                                                family: famId,
                                                                user: userId
                                                            }
                                                        };
                                                        admin.messaging().sendToDevice(token, payload).then(response => {
                                                            console.log("======  success notifier =====");
                                                            console.log(response);
                                                            console.log("======  success =====");
                                                        }).catch(error => {
                                                            console.log("======  error notifier =====");
                                                            console.log(error);
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
                    }));
                }
            });
        }));
    });
}
function onMemberAdded(famId, currentMembers, members) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('addedMembers', members);
        yield Promise.all(members
            .map((member) => __awaiter(this, void 0, void 0, function* () {
            yield admin.database().ref(`/users/${member}/families/${famId}`).set(true);
            yield admin.database().ref(`/groups/${famId}/members/${member}`).set(true);
            yield admin.database().ref(`/families/${famId}`).once("value", snapFam => {
                let fam = snapFam.val();
                _.each(members, userId => {
                    console.log("userId", userId);
                    admin.database().ref(`/users/${userId}`).once("value", snapUsr => {
                        console.log(snapUsr.val());
                        let userRemoved = snapUsr.val();
                        if (userRemoved.hasOwnProperty("tokens")) {
                            let userToken = Object.keys(userRemoved.tokens);
                            _.each(userToken, token => {
                                let payload = {
                                    notification: {
                                        title: `Se te agregó de la familia ${fam.name}`
                                    },
                                    data: {
                                        family: fam.$key,
                                        user: userId
                                    }
                                };
                                admin.messaging().sendToDevice(token, payload).then(response => {
                                    console.log("======  success notifier =====");
                                    console.log(response);
                                    console.log("======  success =====");
                                }).catch(error => {
                                    console.log("======  error notifier =====");
                                    console.log(error);
                                    console.log("======  error =====");
                                });
                            });
                        }
                        _.each(currentMembers, userId => {
                            admin.database().ref(`/users/${userId}`).once("value", snapUsr => {
                                let user = snapUsr.val();
                                if (user.hasOwnProperty("tokens")) {
                                    let userToken = Object.keys(user.tokens);
                                    _.each(userToken, token => {
                                        let payload = {
                                            notification: {
                                                title: fam.name,
                                                body: `Se agregó a ${userRemoved.name} de la familia ${fam.name}`
                                            },
                                            data: {
                                                family: famId,
                                                user: userId
                                            }
                                        };
                                        admin.messaging().sendToDevice(token, payload).then(response => {
                                            console.log("======  success notifier =====");
                                            console.log(response);
                                            console.log("======  success =====");
                                        }).catch(error => {
                                            console.log("======  error notifier =====");
                                            console.log(error);
                                            console.log("======  error =====");
                                        });
                                    });
                                }
                            });
                        });
                    });
                });
            });
        })));
        // let fam : Family = (await promiseOnce('/families/'+famId, 'value')).val();
        // await notifyMembersAdded(fam, famId, members);
    });
}


/***/ }),
/* 5 */
/***/ (function(module, exports) {

module.exports = require("util");

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const functions = __webpack_require__(0);
const admin = __webpack_require__(1);
const _ = __webpack_require__(2);
exports.onAddMemberEvent = functions.database.ref("/events/{id}/members/{idMember}").onCreate((memberSnap) => __awaiter(this, void 0, void 0, function* () {
    let id = memberSnap.params.id;
    let idMember = memberSnap.params.idMember;
    yield admin.database().ref(`/users/${idMember}/events/${id}`).set(true);
    yield admin.database().ref(`/events/${id}`).once("value", (eventSnap) => __awaiter(this, void 0, void 0, function* () {
        let event = eventSnap.val();
        let payload = {
            notification: {
                title: `Nuevo Evento:`,
                body: `Se te agregó al evento: ${event.title || "Nuevo Evento"}`
            },
            data: {
                event: id,
                timestamp: Date.now()
            }
        };
        yield sendNotificationAddEvent(id, idMember, payload);
    }));
}));
exports.onRemoveMemberEvent = functions.database.ref("/events/{id}/members/{idMember}").onDelete((memberSnap) => __awaiter(this, void 0, void 0, function* () {
    let id = memberSnap.params.id;
    let idMember = memberSnap.params.idMember;
    yield admin.database().ref(`/users/${idMember}/events/${id}`).remove();
    yield admin.database().ref(`/events/${id}`).once("value", (eventSnap) => __awaiter(this, void 0, void 0, function* () {
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
        };
        yield sendNotificationRemoveEvent(id, idMember, null, payload);
    }));
}));
exports.onRemoveEvent = functions.database.ref("/events/{id}").onDelete((eventSnap) => __awaiter(this, void 0, void 0, function* () {
    let id = eventSnap.params.id;
    let event = eventSnap.data.val();
    if (event.hasOwnProperty("admins")) {
        yield _.each(Object.keys(event.admins), (adminKey) => __awaiter(this, void 0, void 0, function* () {
            yield admin.database().ref(`/users/${adminKey}/events/${id}`).remove();
            let payload = {
                notification: {
                    title: `Evento ${event.title || "info"}:`,
                    body: `Se eliminó el evento: ${event.title || "Nuevo Evento"}`
                },
                data: {
                    event: id,
                    deleted: true,
                    title: event.title,
                    timestamp: Date.now()
                }
            };
            yield sendNotificationRemoveEvent(id, adminKey, event, payload);
        }));
    }
    if (event.hasOwnProperty("members")) {
        yield _.each(Object.keys(event.members), (user) => __awaiter(this, void 0, void 0, function* () {
            yield admin.database().ref(`/users/${user}/events/${id}`).remove();
            let payload = {
                notification: {
                    title: `Evento ${event.title || "info"}:`,
                    body: `Se eliminó el evento: ${event.title || "Nuevo Evento"}`
                },
                data: {
                    event: id,
                    title: event.title,
                    timestamp: Date.now()
                }
            };
            yield sendNotificationRemoveEvent(id, user, event, payload);
        }));
    }
}));
function sendNotificationAddEvent(eventId, userAdded, payload) {
    return __awaiter(this, void 0, void 0, function* () {
        yield admin.database().ref(`/users/${userAdded}`).once("value", (userSnap) => __awaiter(this, void 0, void 0, function* () {
            let user = userSnap.val();
            yield admin.database().ref(`/events/${eventId}`).once("value", (eventSnap) => __awaiter(this, void 0, void 0, function* () {
                let event = eventSnap.val();
                if (user.hasOwnProperty("tokens")) {
                    _.each(Object.keys(user.tokens), (token) => __awaiter(this, void 0, void 0, function* () {
                        yield admin.messaging().sendToDevice(token, payload).then(success => {
                            console.log("notifier-success: \n", success);
                        }).catch(error => {
                            console.log("notifier-error: \n", error);
                        });
                    }));
                }
            }));
        }));
    });
}
function sendNotificationRemoveEvent(eventId, userAdded, eventData, payload) {
    return __awaiter(this, void 0, void 0, function* () {
        yield admin.database().ref(`/users/${userAdded}`).once("value", (userSnap) => __awaiter(this, void 0, void 0, function* () {
            let user = userSnap.val();
            yield admin.database().ref(`/events/${eventId}`).once("value", (eventSnap) => __awaiter(this, void 0, void 0, function* () {
                let event = eventSnap.val();
                if (eventSnap != null) {
                    if (user.hasOwnProperty("tokens")) {
                        _.each(Object.keys(user.tokens), (token) => __awaiter(this, void 0, void 0, function* () {
                            yield admin.messaging().sendToDevice(token, payload).then(success => {
                                console.log("notifier-success: \n", success);
                            }).catch(error => {
                                console.log("notifier-error: \n", error);
                            });
                        }));
                    }
                }
                else {
                    if (user.hasOwnProperty("tokens")) {
                        _.each(Object.keys(user.tokens), (token) => __awaiter(this, void 0, void 0, function* () {
                            yield admin.messaging().sendToDevice(token, payload).then(success => {
                                console.log("notifier-success: \n", success);
                            }).catch(error => {
                                console.log("notifier-error: \n", error);
                            });
                        }));
                    }
                }
            }));
        }));
    });
}


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const functions = __webpack_require__(0);
const admin = __webpack_require__(1);
const _ = __webpack_require__(2);
exports.OnCreateChat = functions.database.ref("/groups/{id}").onCreate((group) => __awaiter(this, void 0, void 0, function* () {
    let id = group.params.id;
    let gData = group.data.val();
    if (gData.hasOwnProperty("familyId")) {
        yield admin.database().ref(`/families/${gData.familyId}/groups/${id}`).set(true);
    }
}));
exports.OnDeleteChat = functions.database.ref("/groups/{id}").onDelete((group) => __awaiter(this, void 0, void 0, function* () {
    let id = group.params.id;
    let data = group.data.previous.val();
    if (data.hasOwnProperty("familyId")) {
        yield admin.database().ref(`/families/${data.familyId}/groups/${id}`).remove();
    }
}));
exports.OnCreateMessage = functions.database.ref("/messages/{id}").onCreate((data) => __awaiter(this, void 0, void 0, function* () {
    let id = data.params.id;
    let message = data.data.val();
    yield admin.database().ref(`/groups/${message.groupId}/messages/${id}`).set(message.timestamp);
    yield admin.database().ref(`/groups/${message.groupId}/lastMessage`).set(id);
    yield admin.database().ref(`/groups/${message.groupId}/members/${message.remittent}`).set(message.timestamp);
    yield admin.database().ref(`/users/${message.remittent}`).once("value", (remittentSnap) => __awaiter(this, void 0, void 0, function* () {
        let remittent = remittentSnap.val();
        yield admin.database().ref(`/groups/${message.groupId}`).once("value", (groupSnap) => __awaiter(this, void 0, void 0, function* () {
            let group = groupSnap.val();
            if (group.isGroup == true) {
                let members = Object.keys(group.members).filter(item => item != message.remittent);
                yield _.each(members, (idUser) => __awaiter(this, void 0, void 0, function* () {
                    yield admin.database().ref(`/users/${idUser}`).once("value", userSnap => {
                        let user = userSnap.val();
                        let payload = {
                            notification: {
                                title: `Nuevo Mensaje en ${group.title}:`,
                                body: `${remittent.name}: ${message.text}`
                            },
                            data: {
                                chat: message.groupId,
                                familyId: group.familyId
                            }
                        };
                        if (user.hasOwnProperty("tokens")) {
                            let tokens = Object.keys(user.tokens);
                            tokens.forEach(item => admin.messaging().sendToDevice(item, payload)
                                .then(success => console.log(success))
                                .catch(error => console.log(error)));
                        }
                    });
                }));
            }
            else {
                let members = Object.keys(group.members).filter(item => item != message.remittent);
                yield _.each(members, (idUser) => __awaiter(this, void 0, void 0, function* () {
                    yield admin.database().ref(`/users/${idUser}`).once("value", userSnap => {
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
                        };
                        if (user.hasOwnProperty("tokens")) {
                            let tokens = Object.keys(user.tokens);
                            tokens.forEach(item => admin.messaging().sendToDevice(item, payload)
                                .then(success => console.log(success))
                                .catch(error => console.log(error)));
                        }
                    });
                }));
            }
        }));
    }));
}));
exports.onRemoveMemberChat = functions.database.ref("/groups/{idGroup}/members/{idMember}").onDelete((snap) => __awaiter(this, void 0, void 0, function* () {
    let idMember = snap.params.idMember;
    let idGroup = snap.params.idGroup;
    yield admin.database().ref(`/groups/${idGroup}`).once("value", (groupSnap) => __awaiter(this, void 0, void 0, function* () {
        let group = groupSnap.val();
        yield admin.database().ref(`/users/${idMember}`).once("value", (userSnap) => __awaiter(this, void 0, void 0, function* () {
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
            };
            if (user.hasOwnProperty("tokens")) {
                let tokens = Object.keys(user.tokens);
                yield _.each(tokens, token => {
                    admin.messaging().sendToDevice(token, payload).then(success => {
                        console.log("Success Notifier: ", payload);
                    }).catch(error => {
                        console.log("========== error notifier=========== \n", error);
                    });
                });
            }
        }));
    }));
}));
exports.onAddMemberChat = functions.database.ref("/groups/{idGroup}/members/{idMember}").onCreate((snap) => __awaiter(this, void 0, void 0, function* () {
    let idMember = snap.params.idMember;
    let idGroup = snap.params.idGroup;
    yield admin.database().ref(`/groups/${idGroup}`).once("value", (groupSnap) => __awaiter(this, void 0, void 0, function* () {
        let group = groupSnap.val();
        if (group.isGroup == true) {
            yield admin.database().ref(`/users/${idMember}`).once("value", (userSnap) => __awaiter(this, void 0, void 0, function* () {
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
                };
                if (user.hasOwnProperty("tokens")) {
                    let tokens = Object.keys(user.tokens);
                    yield _.each(tokens, token => {
                        admin.messaging().sendToDevice(token, payload).then(success => {
                            console.log("Success Notifier: ", payload);
                        }).catch(error => {
                            console.log("========== error notifier=========== \n", error);
                        });
                    });
                }
            }));
        }
    }));
}));


/***/ })
/******/ ])));