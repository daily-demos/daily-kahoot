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
        .on("joined-meeting", (e) => {
            enableKahootHostIntegration(callFrame);
        })
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

function enableKahootHostIntegration(callFrame) {
    const url = "https://play.kahoot.it/v2/?quizId=c990a754-237c-4d1a-bfe5-c580895d7f5f";
    const integration = {
      controlledBy: [],
      location: "main",
      shared: true,
      src: url,
      label: "Kahoot Host",
      sandbox: "allow-same-origin allow-scripts allow-forms allow-popups",
    };
  
    const integrations = callFrame.customIntegrations();
    integrations.kahootHost = integration;
    callFrame.setCustomIntegrations(integrations);
    callFrame.updateCustomTrayButtons({
      kahootHost: {
        iconPath:
          "https://cdn.glitch.global/37a36d43-2f57-4d0f-942b-c355917cd97c/kahootIcon.png?v=1687582184705",
        label: "Start Kahoot Game",
        tooltip: "Start Kahoot Game",
      },
    });
  }
  