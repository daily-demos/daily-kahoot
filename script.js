const roomURL = "your_daily_room_url";
const hideClassName = "hidden";

window.addEventListener("DOMContentLoaded", (event) => {
    console.log("DOM fully loaded and parsed");
    init();
});

function init() {
    const joinButton = document.getElementById("joinButton");
    joinButton.addEventListener("click", () => {
        updateWelcomeScreenVisibility(false);
        updateWidgetContainerVisibility(true);
        const callFrame = configureCallFrame();
        callFrame.join({
            url: roomURL,
            showFullscreenButton: true,
        });
    });
}

function updateWelcomeScreenVisibility(isVisible) {
    const el = document.getElementById("welcomeScreen");
    if (isVisible) {
        el.classList.remove(hideClassName);
    } else {
        el.classList.add(hideClassName);
    }
}

function updateWidgetContainerVisibility(isVisible) {
    const el = document.getElementById("widgetContainer");
    if (isVisible) {
        el.classList.remove(hideClassName);
    } else {
        el.classList.add(hideClassName);
    }
}

function configureCallFrame() {
    const widget = document.getElementById("widget");
    const callFrame = window.DailyIframe.createFrame(widget, {
        iframeStyle: {
            height: "auto",
            width: "100%",
            aspectRatio: 16 / 9,
            minWidth: "400px",
            maxWidth: "1200px",
            border: "1px solid var(--grey)",
            borderRadius: "4px",
        },
        showLeaveButton: true,
    });

    callFrame
        .on("loaded", logEvent)
        .on("joined-meeting", logEvent)
        .on("left-meeting", () => {
            leaveCall(callFrame);
        })

    return callFrame;
}

function logEvent(e) {
    console.info(e);
}

function leaveCall(callFrame) {
    const welcomeScreen = document.getElementById("welcomeScreen");
    const widgetContainer = document.getElementById("widgetContainer");
    widgetContainer.classList.add(hideClassName);
    welcomeScreen.classList.remove(hideClassName);
    callFrame.destroy();
}
