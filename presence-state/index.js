var pubnub = null;
const users = [];
const CHANNEL_NAME = "lobby.general";
var currentStatus = "available"

//  PubNub keyset info for this demo.  
// This keyset is protected and restricted but you can obtain your own keyset for free at https://admin.pubnub.com/register :) 
const publishKey = "pub-c-2ba371e4-7ee2-478a-ade4-82aad3adb35a";
const subscribeKey = "sub-c-fe695d36-1fb8-4f75-b394-0349d7b2ca26";
const TOKEN_SERVER =
"https://devrel-demos-access-manager.netlify.app/.netlify/functions/api/mini-sample-presence-state";
//const TOKEN_SERVER =
//"http://localhost:8009/.netlify/functions/api/mini-sample-presence-state";

async function init() {
  const myUserId = makeId(20)
  pubnub = await initPubNub(publishKey, subscribeKey, myUserId, TOKEN_SERVER)

  const lobbyChannel = pubnub.channel(CHANNEL_NAME);
  const lobbySubscription = lobbyChannel.subscription({
    receivePresenceEvents: true,
  });

  lobbySubscription.onPresence = (presenceEvent) => {
    //console.log(presenceEvent);
    switch (presenceEvent.action) {
      case "join":
      case "state-change":
        const userObj = {
          uuid: presenceEvent.uuid,
          state: presenceEvent.state,
        };
        addOrModifyUser(userObj);
        break;
      case "leave":
        removeUser(presenceEvent.uuid);
        break;
      case "interval":
        const joiners = presenceEvent.join;
        const leavers = presenceEvent.leave;
        joiners?.forEach((joinerId) => {
          const userObj = {
            uuid: joinerId,
            state: null,
          };
          addOrModifyUser(userObj);
        });
        leavers?.forEach((leaverId) => {
          removeUser(leaverId);
        });
        break;
      default:
        break;
    }
  };

  pubnub.addListener({
    status: (status) => {
      //console.log(status);
    },
  });

  await lobbySubscription.subscribe();

  await pubnub.setState({
    channels: [CHANNEL_NAME],
    state: {
      onlineStatus: currentStatus,
    },
  });

  const result = await pubnub.hereNow({
    channels: [CHANNEL_NAME],
    includeUUIDs: true,
    includeState: true,
  });
  const hereNowUsers = result.channels[CHANNEL_NAME].occupants;
  if (hereNowUsers) {
    hereNowUsers.forEach((user) => addOrModifyUser(user));
  }
}

function addOrModifyUser(newUser) {
  //  Adds a new user to the user array.  This method will be called when a new user joins, or when an existing
  //  user changes their state.
  const index = users.findIndex((user) => user.uuid == newUser.uuid);
  if (index == -1) {
    users.push(newUser);
  } else {
    //  If the newUser does not have a state, use the existing user's state
    const existingUser = users[index];
    if (!newUser.state && existingUser.state) {
      newUser.state = existingUser.state;
    }
    users.splice(index, 1, newUser);
  }
  updateUI();
}

function removeUser(userId) {
  //  Removes the specified user ID from the user array
  const index = users.findIndex((user) => user.uuid == userId);
  if (index != -1) {
    users.splice(index, 1);
    updateUI();
  }
}

function updateUI() {
  const availableUsers = users.filter(
    (user) => user.state && user.state.onlineStatus == "available"
  );
  const busyUsers = users.filter(
    (user) => user.state && user.state.onlineStatus == "busy"
  );

  const userCount = users.length;
  const busyUserCount = busyUsers ? busyUsers.length : 0;
  const availableUserCount = userCount - busyUserCount;

  document.getElementById("totalUsers").innerHTML = userCount;
  document.getElementById("availableUsers").innerHTML = availableUserCount;
  document.getElementById("busyUsers").innerHTML = busyUserCount;
}

function toggleState()
{
  const buttonHeading = document.getElementById('btnHeading')
  const buttonDescription = document.getElementById('btnDescription')
  const labelAvailableUsers = document.getElementById('lblAvailableUsers')
  const labelBusyUsers = document.getElementById('lblBusyUsers')
  const bellIcon = document.getElementById('bellIcon')
  if (currentStatus == "available")
  {
    buttonHeading.innerHTML = "Set Myself Available"
    buttonDescription.innerHTML = "Your State is Currently Busy"
    labelAvailableUsers.innerHTML = "<strong>Available</strong> users:"
    labelBusyUsers.innerHTML = "<strong>Busy</strong> users: (including you)"
    bellIcon.classList.remove('lg:grayscale')
    bellIcon.classList.add('grayscale-0')
    currentStatus = "busy"
  }
  else
  {
    buttonHeading.innerHTML = "Set Myself Busy"
    buttonDescription.innerHTML = "Your State is Currently Available"
    labelAvailableUsers.innerHTML = "<strong>Available</strong> users: (including you)"
    labelBusyUsers.innerHTML = "<strong>Busy</strong> users:"
    bellIcon.classList.add('lg:grayscale')
    bellIcon.classList.remove('grayscale-0')
    currentStatus = "available"
  }

  pubnub.setState({
    channels: [CHANNEL_NAME],
    state: {
      onlineStatus: currentStatus,
    },
  })
}

