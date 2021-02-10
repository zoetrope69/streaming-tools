/* eslint-disable */
/*==========================================*\
| Dynamic HUD (DynaHUD) for Control by reg2k |
\*==========================================*/

const ENEMY_IMAGE =
  "https://static-cdn.jtvnw.net/jtv_user_pictures/69d995d4-8663-49f1-94e3-7ecc76a814c9-profile_image-300x300.png"; // end of ENEMY_IMAGE

(function () {
  // twitch constrol shit
  // setInterval(() => {
  //     const enemyHealthWrapperElements = document.querySelectorAll('.enemy-health-wrapper')
  //     if (enemyHealthWrapperElements) {
  //         enemyHealthWrapperElements.forEach(enemyHealthWrapperElement => {
  //             const enemyHealthValueElement = enemyHealthWrapperElement.querySelector('.enemy-health-value');
  //             let transformStyle = enemyHealthValueElement ? enemyHealthValueElement.style.transform : 'scale(1)'

  //             enemyHealthWrapperElement.innerHTML = `
  //                 <img
  //                   style="height: 64px; border-radius: 50%; transform: ${transformStyle};"
  //                   src="${ENEMY_IMAGE}"
  //                 />
  //             `;
  //         });
  //     }
  // }, 500)

  //=================
  // Configuration
  //=================

  // Note: All configurable timings are in milliseconds.
  // Do not remove the trailing commas!
  const CONFIG = {
    // General Settings
    general: {
      // Whether to enable the dynamic health bar
      dynamicHealthBar: true,

      // Whether to enable the dynamic mission log
      dynamicMissionLog: true,

      // Whether to enable the dynamic crosshair
      dynamicCrosshair: true,
    },

    // Health Bar Settings
    health_bar: {
      // Always keep health bar shown when in combat
      showDuringCombat: true,

      // Show the health bar when health falls below this percentage
      // Range: 0-1, with 1.0 being 100% and 0.5 being 50%
      showHealthThreshold: 1.0,

      // The time before the health bar fades away when at full health
      hpFadeTime: 2000,
    },

    // Mission Log Settings
    mission_log: {
      // How long to show the mission log initially (e.g. after unpausing
      // the game or loading) before hiding it.
      initialHideTime: 2000,

      // How long to show the mission log after the map has been closed.
      // Set to 0 to hide the mission log immediately.
      afterMapCloseHideTime: 3000,

      // How long to keep the mission log open after it has been updated.
      // Set to 0 to not show the mission log at all when an objective is updated.
      missionUpdateHideTime: 7000,
    },
  };

  //====================
  // End Configuration
  //====================

  // Import useful library functions from the UI Framework
  const { waitForSelector, getComponent } = UIF;

  //===========
  // Constants
  //===========
  const PLAYER_MODE = {
    COMBAT: 0,
    ADVENTURING: 1,
    STORY: 2,
    ACTION: 3,
    EXAMINE: 4,
    HIDDEN: 5,
  };
  // Player Modes
  // 0: PLAYER_MODE_COMBAT
  // 1: PLAYER_MODE_ADVENTURING (e.g. running around, no enemies)
  // 2: PLAYER_MODE_STORY (e.g. central executive)
  // 3: PLAYER_MODE_ACTION (e.g. aiming, levitating, melee while out of combat)
  // 4: PLAYER_MODE_EXAMINE (e.g. ?)
  // 5: HIDDEN (e.g. ?)

  //=========
  // State
  //=========

  //=========
  // Code
  //=========
  _LOG("DynamicHUD start");

  // Create instances
  if (CONFIG.general.dynamicHealthBar) {
    _LOG("Configuring health bar...");
    setupHealthBar(CONFIG.health_bar);
  }

  if (CONFIG.general.dynamicMissionLog) {
    _LOG("Configuring mission log...");
    let missionLog = new setupMissionLog(CONFIG.mission_log);
  }

  if (CONFIG.general.dynamicCrosshair) {
    _LOG("Configuring crosshair...");
    setupCrosshair();
  }

  _LOG("Configuring ammo bar...");
  let ammoBar = new setupAmmoBar();

  _LOG("Setup complete.");

  //==============
  // Health Bar
  //==============
  function setupHealthBar(CONFIG) {
    // State
    let hpbarShown = true; // to keep track internally whether we have hidden or shown the component
    let hpbarHideTimerID = 0;
    let playerMode = g_HUDMode.m_iPlayerMode;

    // Elements
    let hpbar, hpbarFill;

    // Do nothing if health bar is disabled in game settings
    if (!g_runtimeInterfaceOptions.m_bPlayerStatsEnabled) {
      _LOG("DynaHUD: Health bar disabled");
      return;
    }

    UIF.hud.onHUDVisible(() => {
      hpbarShown = true;
      Promise.all([
        waitForSelector(".health-bar"),
        waitForSelector(".health-bar__fill"),
      ]).then((elems) => {
        [hpbar, hpbarFill] = elems;
        onHPChange();
        let hpObserver = new MutationObserver((ms) =>
          ms.forEach((m) => onHPChange())
        );
        hpObserver.observe(hpbarFill, {
          attributes: true,
          attributeFilter: ["style"],
        });
      });
    });

    // Register player mode change listener
    if (CONFIG.showDuringCombat) {
      engine.addModelChangeListener(
        g_HUDMode,
        "m_iPlayerMode",
        () => {
          let newMode = g_HUDMode.m_iPlayerMode;
          let oldMode = playerMode;

          if (newMode != oldMode) {
            playerMode = newMode;
            if (newMode == PLAYER_MODE.COMBAT) {
              _LOG("HP: Player entering combat");
              onHPChange();
            } else if (oldMode == PLAYER_MODE.COMBAT) {
              _LOG("HP: Player leaving combat");
              onHPChange();
            }
          }
        }
      );
    }

    function onHPChange() {
      var healthPercent =
        hpbarFill.getBoundingClientRect().width /
        hpbarFill.offsetWidth;
      // _LOG('HP changed: ' + healthPercent);

      // If healthPercent < 1 OR in combat then show, otherwise hide.
      let shouldShow =
        healthPercent < CONFIG.showHealthThreshold ||
        (CONFIG.showDuringCombat && playerMode == PLAYER_MODE.COMBAT);
      if (!hpbarShown && shouldShow) {
        _LOG("Showing HP bar");
        hpbarShown = true;
        hpbar.style.opacity = ""; // remove override and use style-defined opacity

        // Cancel any pending fade-out requests
        if (hpbarHideTimerID) {
          clearTimeout(hpbarHideTimerID);
          hpbarHideTimerID = 0;
        }
      } else if (hpbarShown && !shouldShow) {
        // Schedule fading out HP bar
        if (!hpbarHideTimerID) {
          hpbarHideTimerID = setTimeout(() => {
            _LOG("Hiding HP bar");
            hpbarShown = false;
            hpbar.style.opacity = getCSSProperty(
              "--dynahud-opacity-hp-bar-hidden"
            );
            hpbarHideTimerID = 0;
          }, CONFIG.hpFadeTime);
        }
      }
    }
  }

  //==============
  // Mission Log
  //==============
  function setupMissionLog(CONFIG) {
    // State
    let missionLogShown = false;
    let hideTimer = 0;

    // Elements
    let map, missionLog;

    // Code

    // Do nothing if mission overlay is turned off in game settings
    if (!g_runtimeInterfaceOptions.m_bMissionHUDEnabled) {
      _LOG("DynaHUD: Mission overlay not enabled");
      return;
    }

    // Register for HUD visibility
    UIF.hud.onHUDVisible(() => {
      Promise.all([
        waitForSelector(".map-overlay"),
        waitForSelector(".mission-log-wrapper"),
      ]).then((elems) => {
        // var allClasses = [];

        // var allElements = document.querySelectorAll('.app-content > .hud > *');

        // for (var i = 0; i < allElements.length; i++) {
        //     var classes = allElements[i].className.toString().split(/\s+/);
        //     for (var j = 0; j < classes.length; j++) {
        //         var cls = classes[j];
        //         if (cls && allClasses.indexOf(cls) === -1) {
        //             allClasses.push(cls);
        //         }
        //     }
        // }

        // debugElement.innerText = allClasses.join('\n')
        // document.body.appendChild(debugElement);

        [map, missionLog] = elems;

        // Schedule to fade out
        hideMissionLog(CONFIG.initialHideTime);

        // Register observer for map class changes
        var mapObserver = new MutationObserver((ms) =>
          ms.forEach((m) => onMapClassChanged())
        );
        mapObserver.observe(map, {
          attributes: true,
          attributeFilter: ["class"],
        });
      });
    });

    // Register for events
    engine.addModelChangeListener(
      g_missionPromptUIData,
      "m_missionUIData",
      () => {
        if (map && missionLog) {
          let m_eUpdateType = g_missionPromptUIData.m_eUpdateType;
          _LOG(
            "g_missionPromptUIData.m_eUpdateType = " + m_eUpdateType
          );

          if (CONFIG.missionUpdateHideTime > 0) {
            showMissionLog(false);
            hideMissionLog(CONFIG.missionUpdateHideTime);
          }
        }
      }
    );

    // Event Handlers
    function onMapClassChanged() {
      let isInMap = map.classList.contains("map--show");
      missionLog.classList.toggle("dynahud-in-map", isInMap);
      if (isInMap) {
        // Map is now shown
        showMissionLog(true);
      } else {
        // Map is now hidden
        if (missionLogShown) {
          hideMissionLog(CONFIG.afterMapCloseHideTime);
        }
      }
    }

    // Utilities
    function hideMissionLog(time) {
      if (!hideTimer) {
        hideTimer = setTimeout(() => {
          missionLogShown = false;
          missionLog.classList.add("dynahud-hide");
          hideTimer = 0;
        }, time);
      }
    }

    function showMissionLog(forceOpacity = true) {
      if (hideTimer) {
        // Cancel any pending hide requests
        clearTimeout(hideTimer);
        hideTimer = 0;
      }
      missionLog.classList.remove("dynahud-hide");
      missionLogShown = true;
    }
  }

  //==============
  // Crosshair
  //==============
  function setupCrosshair() {
    // State
    let playerMode = g_HUDMode.m_iPlayerMode;

    // Elements
    let crosshair;

    UIF.hud.onHUDVisible(() => {
      waitForSelector(".awesome-crosshair").then((crosshairElem) => {
        crosshair = crosshairElem;
        evaluateDisplayConditions();
      });
    });

    // Register player mode change listener
    engine.addModelChangeListener(g_HUDMode, "m_iPlayerMode", () => {
      let newMode = g_HUDMode.m_iPlayerMode;
      let oldMode = playerMode;

      if (newMode != oldMode) {
        playerMode = newMode;
        if (newMode == PLAYER_MODE.ADVENTURING) {
          // _LOG("Crosshair: Player entering adventuring mode")
          evaluateDisplayConditions();
        } else if (oldMode == PLAYER_MODE.ADVENTURING) {
          // _LOG("Crosshair: Player leaving adventuring mode, new: " + newMode)
          evaluateDisplayConditions();
        }
      }
    });

    function evaluateDisplayConditions() {
      let shouldHideCrosshair = playerMode == PLAYER_MODE.ADVENTURING;
      crosshair.classList.toggle("dynahud-hide", shouldHideCrosshair);
    }
  }

  //==============
  // Ammo Bar
  //==============
  function setupAmmoBar() {
    // Get user's opacity preference
    let desiredOpacity = getCSSProperty("--dynahud-opacity-ammo-bar");
    if (desiredOpacity < 1) {
      UIF.hud.onHUDVisible(() => {
        waitForSelector(".awesome-crosshair--ammo").then(
          (ammoBar) => {
            // Get the ammo model
            let ammoBarComponent = getComponent(ammoBar);
            let ammoModel = ammoBarComponent.ammoModel;

            // Give the ammo bar a CSS opacity transition since we're going to override the JS tween
            ammoBar.style.transition = "opacity 300ms var(--easing)";

            // Hook AmmoModel.setAmmoCounterVisibilityState
            ammoModel.setAmmoCounterVisibilityState; // for some reason, need to access it before we can overwrite it
            ammoModel.setAmmoCounterVisibilityState = (visible) => {
              _LOG("setAmmoCounterVisibilityState: " + visible);
              ammoModel.showAmmoCounter = visible;
              ammoModel.globalOpacity = visible ? desiredOpacity : 0;
            };
          }
        );
      });
    }
  }

  //==============
  // Utilities
  //==============
  function getCSSProperty(name) {
    return getComputedStyle(
      document.documentElement
    ).getPropertyValue(name);
  }
})();
