async function initPubNub(publishKey, subscribeKey, myUserId, tokenServer) {
    const pubnub = new PubNub({
        publishKey: publishKey,
        subscribeKey: subscribeKey,
        userId: myUserId
    })
    var accessManagerToken = await requestAccessManagerToken(myUserId, tokenServer)
    if (accessManagerToken == null)
    {
        console.error(`Error retrieving access manager token for userId ${myUserId} on sub key ${subscribeKey}`)
    }
    else 
    {
        pubnub.setToken(accessManagerToken)
    }
    return pubnub
}

async function requestAccessManagerToken(userId, tokenServer) {
  try {
    const response = await fetch(`${tokenServer}/grant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ UUID: userId }),
    });

    const token = (await response.json()).body.token;

    return token;
  } catch (e) {
    console.log("failed to create token " + e);
    return null;
  }
}

function makeId(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
