const roomURL = 'https://lizashul.daily.co/hello';
const kahootQuizURL =
    'https://play.kahoot.it/v2/?quizId=c990a754-237c-4d1a-bfe5-c580895d7f5f';
const hideClassName = 'hidden';

const Integration = {
  Host: "kahootHost",
  Player: "kahootPlayer"
}

window.addEventListener('DOMContentLoaded', () => {
  // Set up the join button as soon as the DOM loads.
  const joinButton = document.getElementById('joinButton');
  joinButton.addEventListener('click', () => {
    updateWelcomeScreenVisibility(false);
    updateCallContainerVisibility(true);
    const callFrame = configureCallFrame();
    callFrame.join({
      url: roomURL,
    });
  });
});

/**
 * Instantiates a Daily call frame and configures relevant Daily event handlers
 * @returns {*}
 */
function configureCallFrame() {
  const widget = document.getElementById('widget');
  const callFrame = window.DailyIframe.createFrame(widget, {
    iframeStyle: {
      height: 'auto',
      width: '100%',
      aspectRatio: 16 / 9,
      minWidth: '400px',
      maxWidth: '1200px',
      border: '1px solid var(--grey)',
      borderRadius: '4px',
    },
    showLeaveButton: true,
    showFullscreenButton: true,
  });

  callFrame
      .on('joined-meeting', () => {
        // Enable the host integration by default
        // We'll disable it if someone else is already hosting
        updateIntegrations(callFrame, Integration.Host);
      })
      .on('left-meeting', () => {
        leaveCall(callFrame);
      })
      .on('custom-button-click', (e) => {
        const localParticipant = callFrame.participants().local;
        // If the button clicked is not the Kahoot host button, we have
        // nothing more to do - early out.
        if (e.button_id !== Integration.Host) return;

        // Get the current Kahoot host's ID, if any
        const currentKahootHost = getCurrentKahootHost(callFrame);

        // If there is no current Kahoot host, a game is not running.
        // Therefore, the local participant's button click starts a new game.
        if (!currentKahootHost) {
          console.log("starting kahoot host integration")
          callFrame.startCustomIntegrations([Integration.Host]);
          updateGameHostState(callFrame, true);
          updateKahootHostButton(callFrame, false);
        }
        console.log("current kahoot host:", currentKahootHost, localParticipant.session_id)

        // If there is an ongoing game and the local player is the host,
        // the button click stops the game.
        if (currentKahootHost === localParticipant.session_id) {
          callFrame.stopCustomIntegrations([Integration.Host]);
          updateKahootHostButton(callFrame, true);
          updateGameHostState(callFrame, false);
        }
      })
      .on('participant-left', (e) => {
        const participant = e.participant;
        const isHost = !!participant.userData?.isKahootHost;
        console.log("participant left:", participant, isHost)
        // If the participant who just left is a current host,
        // end the game and let someone else start a new one.
        if (isHost) {
          updateIntegrations(callFrame, Integration.Host)
        }
      })
      .on('app-message', (e) => {
        const { data } = e;

        // If the isGameStarted property is not the one being updated,
        // there's nothing further to do. Early out.
        if (data.isGameStarted === undefined) return;
        const isStarted = !!data.isGameStarted;

        // If the game has just been started, enable the join integration
        if (isStarted) {
          updateIntegrations(callFrame, Integration.Player)
          return;
        }

        // If the game has just been stopped, disable the join
        // integration and enable the kahoot host integration.
        updateIntegrations(callFrame, Integration.Host)
      })
      .on('participant-joined', (e) => {
        // If this player is a current Kahoot host, disable
        // the local host integration and enable the player integration.
        const isHost = !!e.participant.userData?.isKahootHost;
        if (isHost) {
          updateIntegrations(callFrame, Integration.Player)
        }
      });

  return callFrame;
}

/**
 * Leaves the Daily video call
 * @param callFrame
 */
function leaveCall(callFrame) {
  const welcomeScreen = document.getElementById('welcomeScreen');
  const callContainer = document.getElementById('callContainer');
  callContainer.classList.add(hideClassName);
  welcomeScreen.classList.remove(hideClassName);
  callFrame.destroy();
}

/**
 * Updates the text of the Kahoot host button to represent current game state
 * @param callFrame
 * @param enableStart
 */
function updateKahootHostButton(callFrame, enableStart) {
  const buttons = callFrame.customTrayButtons();
  if (enableStart) {
    buttons.kahootHost.label = 'Start Kahoot Game';
    buttons.kahootHost.tooltip = 'Start Kahoot Game';
  } else {
    buttons.kahootHost.label = 'Exit Kahoot';
    buttons.kahootHost.tooltip = 'Exit Kahoot';
  }
  callFrame.updateCustomTrayButtons(buttons);
}

/**
 * Updates the local user's Kahoot host state and broadcasts
 * that state as an app-message to all other participants.
 * @param callFrame
 * @param isStartingGame
 */
function updateGameHostState(callFrame, isStartingGame) {
  callFrame.setUserData({
    isKahootHost: isStartingGame,
  });

  callFrame.sendAppMessage({ isGameStarted: isStartingGame }, '*');
}

/**
 * Gets the current Kahoot host, if any, and returns their Daily session ID
 * @param callFrame
 * @returns {undefined|string}
 */
function getCurrentKahootHost(callFrame) {
  const allParticipants = callFrame.participants();
  const participants = Object.values(allParticipants);
  for (let i = 0; i < participants.length; i += 1) {
    const p = participants[i];
    if (!!p.userData?.isKahootHost) {
      return p.session_id;
    }
  }
  return undefined;
}

function updateIntegrations(callFrame, integration) {
  console.log("integration", integration)
  const integrations = callFrame.customIntegrations();

  switch (integration) {
    case Integration.Host:
      delete integrations[Integration.Player];
      const hostIntegration = {
        controlledBy: [],
        location: 'main',
        shared: true,
        src: kahootQuizURL,
        label: 'Kahoot Host',
        sandbox: 'allow-same-origin allow-scripts allow-forms allow-popups',
      };
      integrations[Integration.Host] = hostIntegration;
      callFrame.updateCustomTrayButtons({
        kahootHost: {
          iconPath:
              'https://cdn.glitch.global/37a36d43-2f57-4d0f-942b-c355917cd97c/kahootIcon.png?v=1687582184705',
          label: 'Start Kahoot Game',
          tooltip: 'Start Kahoot Game',
        },
      });
      break;
    case Integration.Player:
      delete integrations[Integration.Host];
      const url = 'https://kahoot.it';
      const playerIntegration = {
        location: 'main',
        shared: false,
        src: url,
        label: 'Play Kahoot',
        sandbox: 'allow-same-origin allow-scripts allow-forms',
      };
      integrations[Integration.Player] = playerIntegration;
      break;
    default:
      console.error("Unsupported integration requested: ", integration);
      return;
  }
  callFrame.setCustomIntegrations(integrations);
  if (integration === Integration.Player) {
  //  callFrame.startCustomIntegrations([Integration.Player]);
  }
}

/**
 * Turns welcome screen visibility on or off
 * @param isVisible
 */
function updateWelcomeScreenVisibility(isVisible) {
  const el = document.getElementById('welcomeScreen');
  if (isVisible) {
    el.classList.remove(hideClassName);
  } else {
    el.classList.add(hideClassName);
  }
}

/**
 * Turns widget container visibility on or off
 * @param isVisible
 */
function updateCallContainerVisibility(isVisible) {
  const el = document.getElementById('callContainer');
  if (isVisible) {
    el.classList.remove(hideClassName);
  } else {
    el.classList.add(hideClassName);
  }
}
