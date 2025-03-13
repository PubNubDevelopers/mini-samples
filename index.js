const users = [];
const CHANNEL_NAME = "lobby.general";

const PUBNUB_CONFIG = {
  //  todo protect this keyset
  publishKey: "pub-c-2ba371e4-7ee2-478a-ade4-82aad3adb35a",
  subscribeKey: "sub-c-fe695d36-1fb8-4f75-b394-0349d7b2ca26",
  userId: makeid(20),
};

function makeid(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

const pubnub = new PubNub(PUBNUB_CONFIG);

async function init() {
  const lobbyChannel = pubnub.channel(CHANNEL_NAME);
  const lobbySubscription = lobbyChannel.subscription({
    receivePresenceEvents: true,
  });

  lobbySubscription.onPresence = (presenceEvent) => {
    console.log(presenceEvent);
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
      console.log(status);
    },
  });

  await lobbySubscription.subscribe();

  await pubnub.setState({
    channels: [CHANNEL_NAME],
    state: {
      onlineStatus: "available",
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
  console.log(users)
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

function setMyState(newState)
{
    pubnub.setState({
        channels: [CHANNEL_NAME],
        state: {
          onlineStatus: newState,
        },
    })

    const busyIcon = document.getElementById('busyIcon')
    const availableIcon = document.getElementById('availableIcon')
    console.log(newState)
    if (newState == 'busy')
    {
        //  Illuminate the busy icon on UI
        availableIcon.classList.remove('yellowBackground')
        busyIcon.classList.add('redBackground')
    }
    else
    {
        availableIcon.classList.add('yellowBackground')
        busyIcon.classList.remove('redBackground')
    }

}
