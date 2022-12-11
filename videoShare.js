// https://github.com/AgoraIO/API-Examples-Web
let client = AgoraRTC.createClient({
    mode: "rtc",
    codec: "vp8"
});
AgoraRTC.enableLogUpload();
let localTracks = {
    screenVideoTrack: null,
    audioTrack: null,
    screenAudioTrack: null
};
let options = {
    appid: "",
    channel: "room1",
    uid: null,
    token: null
};

join();

async function join() {
    client.on("user-published", handleUserPublished);
    client.on("user-unpublished", handleUserUnpublished);
    let screenTrack;
    [options.uid, localTracks.audioTrack, screenTrack] = await Promise.all([
        client.join(options.appid, options.channel, options.token || null, options.uid || null),
        AgoraRTC.createMicrophoneAudioTrack(), AgoraRTC.createScreenVideoTrack({
            encoderConfig: "720p"
        }, "auto")]);
    if (screenTrack instanceof Array) {
        localTracks.screenVideoTrack = screenTrack[0];
        localTracks.screenAudioTrack = screenTrack[1];
    } else {
        localTracks.screenVideoTrack = screenTrack;
    }
    localTracks.screenVideoTrack.play("local-player");
    $("#local-player-name").text(`localVideo(${options.uid})`);
    localTracks.screenVideoTrack.on("track-ended", () => {
        localTracks.screenVideoTrack && localTracks.screenVideoTrack.close();
        localTracks.screenAudioTrack && localTracks.screenAudioTrack.close();
        localTracks.audioTrack && localTracks.audioTrack.close();
    });
    if (localTracks.screenAudioTrack == null) {
        await client.publish([localTracks.screenVideoTrack, localTracks.audioTrack]);
    } else {
        await client.publish([localTracks.screenVideoTrack, localTracks.audioTrack, localTracks.screenAudioTrack]);
    }
}
async function subscribe(user, mediaType) {
    const uid = user.uid;
    await client.subscribe(user, mediaType);
    if (mediaType === 'video') {
        const player = $(`
      <div id="player-wrapper-${uid}">
        <p class="player-name">remoteUser(${uid})</p>
        <div id="player-${uid}" class="player"></div>
      </div>
    `);
        $("#remote-playerlist").append(player);
        user.videoTrack.play(`player-${uid}`);
    }
    if (mediaType === 'audio') {
        user.audioTrack.play();
    }
}
function handleUserPublished(user, mediaType) {
    subscribe(user, mediaType);
}
function handleUserUnpublished(user, mediaType) {
    if (mediaType === 'video') {
        const id = user.uid;
        $(`#player-wrapper-${id}`).remove();
    }
}