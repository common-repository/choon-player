/*
 * Audio controls for the browser audio player
 *
 * Version: 2.2
 * Date: 4 Mar 2021
 */

/*
Copyright (C) 2020 Andy Linton

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

"use strict";

const choon = (function () {

    let beginLoopTime = 0;
    let endLoopTime = 0;

    let abcStopped = false;
    let abcCurrentTime = 0;
    let intervalHandle;
    let bpmReset = 0;
    let currentABCSlider = null;
    let currentSpeedSlider = null;
    let tuneABC = null;
    let currentABCID = null;

    function createMP3player(tuneID, mp3url) {
        // build the MP3 player for each tune
        let mp3player = `
<!-- MP3 player -->
<form onsubmit="return false" oninput="level.value = flevel.valueAsNumber">
    <div id="choon-MP3Player-${tuneID}" class="choon-audioParent">
        <!-- audio slider -->
        <div id="choon-audioSliderMP3-${tuneID}" "class="choon-audioControlMP3"></div>
	    <!-- loop control -->
	    <div class="choon-loopControlMP3">
            <span title="Play tune, select loop starting point, then select loop end point">
                <button class="choon-loopButton" id="LoopStart-${tuneID}" onclick="choon.setFromSlider('${tuneID}')">Loop Start</button>
                <button class="choon-loopButton" id="LoopEnd-${tuneID}" onclick="choon.setToSlider('${tuneID}')">Loop End</button>
                <button class="choon-loopButton" id="Reset-${tuneID}" onclick="choon.resetFromToSliders('${tuneID}')">Reset</button>
            </span>
        </div>
        <!-- speed slider -->
        <div id="choon-speedControl-${tuneID}" class="choon-speedControl">
            <span title="Adjust playback speed with slider">
                <div id="choon-speedSliderMP3-${tuneID}"></div>
            </span>
        </div>                
        <!-- play button -->
        <button id="choon-playMP3-${tuneID}" class="choon-playButton" onclick="choon.playAudio(${tuneID}, '${mp3url}')"></button>
    </div>
</form>
<!-- END of MP3player -->`;

        return mp3player;
    }

    function createAudioSliders(tuneID) {
        let audioSlider = document.getElementById(`choon-audioSliderMP3-${tuneID}`);
        let speedSlider = document.getElementById(`choon-speedSliderMP3-${tuneID}`);

        noUiSlider.create(audioSlider, {
            start: [0, 0, 100],
            connect: [false, true, true, false],
            step: 0.25,
            range: {
                min: 0,
                max: 100,
            },
        });

        noUiSlider.create(speedSlider, {
            start: [100],
            connect: [true, false],
            step: 5,
            tooltips: [
                wNumb({
                    decimals: 0,
                    prefix: "Speed: ",
                    postfix: " %",
                }),
            ],
            range: {
                min: 50,
                max: 120,
            }
        });

        audioSlider.noUiSlider.on("start", function (value) {
            choonAudioPlayer.onplaying = function () {
                choonAudioPlayer.pause();
            };
        });
        audioSlider.noUiSlider.on("end", function (value) {
            choonAudioPlayer.onplaying = function () {
                choonAudioPlayer.play();
            };
        });

        // How to disable handles on audioslider.
        speedSlider.noUiSlider.on("start", function (value) {
            choonAudioPlayer.onplaying = function () {
                choonAudioPlayer.pause();
            };
        });
        speedSlider.noUiSlider.on("end", function (value) {
            choonAudioPlayer.onplaying = function () {
                choonAudioPlayer.play();
            };
        });
    }

    function playAudio(tuneID, audioSource) {
        // if there is more than one tune on the page
        // we need to reset it if it has been played
        if (choonAudioPlayer.tuneID && choonAudioPlayer.tuneID != tuneID) {
            choonAudioPlayer.playButton.className = "";
            choonAudioPlayer.playButton.className = "choon-playButton";
            choonAudioPlayer.currentTime = 0;
            positionUpdate();
            choonAudioPlayer.audioSlider.noUiSlider.disable();
            choonAudioPlayer.speedSlider.noUiSlider.disable();
        }

        let playButton = document.getElementById(`choon-playMP3-${tuneID}`);
        let audioSlider = document.getElementById(`choon-audioSliderMP3-${tuneID}`);
        let speedSlider = document.getElementById(`choon-speedSliderMP3-${tuneID}`);

        // Bind these to the choonAudioPlayer
        choonAudioPlayer.tuneID = tuneID;
        choonAudioPlayer.playButton = playButton;
        choonAudioPlayer.audioSlider = audioSlider;
        choonAudioPlayer.speedSlider = speedSlider;

        if (choonAudioPlayer.playButton.className == "choon-playButton") {
            if (!choonAudioPlayer.src.includes(audioSource)) {
                choonAudioPlayer.src = audioSource;
                choonAudioPlayer.load();
                choonAudioPlayer.audioSlider.noUiSlider.updateOptions({
                    tooltips: [true, true, true],
                });

                choonAudioPlayer.onloadedmetadata = function () {
                    initialiseSliders();
                    resetFromToSliders(tuneID);
                };
            }
            // Initialise the loop
            if (!endLoopTime) {
                endLoopTime = choonAudioPlayer.duration;
            }

            // These event listeners keep track of the cursor and restarts the loops
            // when needed - we don't need to set it elsewhere;
            choonAudioPlayer.addEventListener("timeupdate", positionUpdate);
            choonAudioPlayer.addEventListener("ended", restartLoop);
            choonAudioPlayer.playbackRate = choonAudioPlayer.speedSlider.noUiSlider.get() / 100;

            choonAudioPlayer.playButton.className = "";
            choonAudioPlayer.playButton.className = "choon-pauseButton";
            let playPromise = choonAudioPlayer.play();
            if (playPromise) {
                playPromise.catch(function (error) {
                    console.error(error);
                });
            }
        } else {
            choonAudioPlayer.playButton.className = "";
            choonAudioPlayer.playButton.className = "choon-playButton";
            choonAudioPlayer.pause();
        }
    }

    function setFromSlider(tuneID) {
        if (tuneID == choonAudioPlayer.tuneID) {
            choonAudioPlayer.audioSlider.noUiSlider.setHandle(0, choonAudioPlayer.currentTime);
            beginLoopTime = choonAudioPlayer.currentTime;
        }
    }

    function setToSlider(tuneID) {
        if (tuneID == choonAudioPlayer.tuneID) {
            choonAudioPlayer.audioSlider.noUiSlider.setHandle(2, choonAudioPlayer.currentTime);
            endLoopTime = choonAudioPlayer.currentTime;
        }
    }

    function resetFromToSliders(tuneID) {
        if (tuneID == choonAudioPlayer.tuneID) {
            choonAudioPlayer.audioSlider.noUiSlider.setHandle(0, 0);
            beginLoopTime = 0;
            choonAudioPlayer.audioSlider.noUiSlider.setHandle(2, choonAudioPlayer.duration);
            endLoopTime = choonAudioPlayer.duration;
        }
    }

    //
    // Internal functions
    //
    function initialiseSliders() {
        choonAudioPlayer.audioSlider.noUiSlider.enable();
        choonAudioPlayer.speedSlider.noUiSlider.enable();

        choonAudioPlayer.audioSlider.noUiSlider.on("change", function (values, handle) {
            if (handle === 0) {
                beginLoopTime = values[0];
                endLoopTime = Math.min(choonAudioPlayer.duration, values[2]);
            } else if (handle === 2) {
                beginLoopTime = values[0];
                endLoopTime = Math.min(choonAudioPlayer.duration, values[2]);
            } else if (handle === 1) {
                choonAudioPlayer.currentTime = values[1];
            }
        });

        choonAudioPlayer.audioSlider.noUiSlider.updateOptions({
            range: {
                min: 0,
                max: choonAudioPlayer.duration,
            },
        });

        choonAudioPlayer.speedSlider.noUiSlider.on("change", function (value) {
            choonAudioPlayer.playbackRate = value / 100;
        });
    }

    function positionUpdate() {
        if (choonAudioPlayer.currentTime >= endLoopTime) {
            choonAudioPlayer.currentTime = beginLoopTime;
        }
        choonAudioPlayer.audioSlider.noUiSlider.setHandle(1, choonAudioPlayer.currentTime);
    }

    function restartLoop() {
        choonAudioPlayer.currentTime = beginLoopTime;
        //console.log("Restarting loop at: " + choonAudioPlayer.currentTime);
        choonAudioPlayer.play();
    }

    /*
     * Controls for the abc  player
     *
     */

    // Select a timbre that sounds like an electric piano.
    let instrument;

    function createABCplayer(textArea, tuneID, timbre) {
        /*
         * Generate the HTML needed to play ABC tunes
         */
        instrument = makeInstrument(timbre);

        let abcPlayer = `
<form onsubmit="return false" oninput="level.value=flevel.valueAsNumber">
    <div class="choon-audioParent" id="ABC${tuneID}">
        <div id="audioSliderABC${tuneID}" class="choon-audioControlABC"></div>
        <div>
            <span title="Adjust playback speed with slider">
                <div id="speedSliderABC${tuneID}" class="choon-speedControl"></div>
            </span>
        </div>
        <div>
            <button id="playABC${tuneID}" class="choon-playButton" onclick="choon.playABC(${textArea}, ${tuneID}, '100')"></button>
        </div>
    </div>
</form>`;

        return abcPlayer;
    }

    function makeInstrument(timbre) {
        /*
         * Some old iPads break badly running more recent Javascript
         * We abstract this out into a separate function so that when it fails
         * the rest of the code continues on working - Arghh!
         */
        let tempInstrument = new Instrument(timbre);
        return tempInstrument;
    }

    /*
     * Play an ABC tune when the button gets pushed
     */
    function playABC(textArea, tuneID, bpm) {
        // if there is more than one tune on the page
        // we need to reset things if a different has been played
        if (currentABCID && currentABCID != tuneID) {
            let playButton = document.getElementById(`playABC${currentABCID}`);
            if (playButton) {
                playButton.className = "";
                playButton.className = "choon-playButton";
            }
            currentSpeedSlider.noUiSlider.off("change");
            // Stop any current player
            stopABCplayer();
            tuneABC = null;
        }
        currentABCID = tuneID;

        // now we can play this tune!
        let playButton = document.getElementById(`playABC${tuneID}`);
        currentABCSlider = document.getElementById(`audioSliderABC${tuneID}`);

        currentSpeedSlider = document.getElementById(`speedSliderABC${tuneID}`);
        changeABCspeed(tuneID, currentSpeedSlider.noUiSlider.get());
        currentSpeedSlider.noUiSlider.on("change", function (value) {
            changeABCspeed(tuneID, value);
        });


        if (playButton.className == "choon-playButton") {
            /*
             * Our simple ABC player doesn't handle repeats well.
             * This function unrolls the ABC so that things play better.
             */
            if (tuneABC == null) {
                tuneABC = preProcessABC(textArea.value);
            }

            // speed was reset before play started
            if (bpmReset) {
                bpm = bpmReset;
            }
            // calculate tune length
            setTuneDuration(tuneABC, bpm);

            let ticks = calculateTicks(tuneABC, bpm);
            startABCplayer(tuneABC, ticks);
            playButton.className = "";
            playButton.className = "choon-stopButton";
        } else {
            stopABCplayer();
            playButton.className = "";
            playButton.className = "choon-playButton";
        }
    }

    function changeABCspeed(tuneID, bpm) {
        let playButton = document.getElementById(`playABC${tuneID}`);
        /*
         * stop any current player
         */
        stopABCplayer();

        // save the speed
        bpmReset = bpm;

        // if there's an active player, restart it at the new speed
        if (playButton.className == "choon-stopButton") {
            // Change the speed of playback
            setTuneDuration(tuneABC, bpm);

            let ticks = calculateTicks(tuneABC, bpm);
            startABCplayer(tuneABC, ticks);
        }
    }

    function setTuneDuration(tuneABC, bpm) {
        // calculate number of bars
        let bars = tuneABC.match(/\|/g || []).length;
        bars = Math.floor(bars / 8) * 8;

        // Get the meter from the ABC
        let meterStr = getABCheaderValue("M:", tuneABC);
        if (meterStr == "C") {
            meterStr = "4/4";
        }
        if (meterStr == "C|") {
            meterStr = "2/2";
        }
        if (!meterStr) {
            console.error("M: not defined - defaulted to 4/4");
            meterStr = "4/4";
        }

        let noteLenStr = getABCheaderValue("L:", tuneABC);
        if (!noteLenStr) {
            noteLenStr = "1/8";
        }

        let tuneDuration = (bars * eval(meterStr) * 16 * eval(noteLenStr) * 60) / bpm;

        currentABCSlider.noUiSlider.updateOptions({
            range: {
                min: 0,
                max: tuneDuration,
            },
        });
    }

    function calculateTicks(tuneABC, bpm) {
        // The ABC L: value scales the ticks value!
        let noteLenStr = getABCheaderValue("L:", tuneABC);
        if (!noteLenStr) {
            noteLenStr = "1/8";
        }

        return bpm / (2 * eval(noteLenStr));
    }

    function startABCplayer(tuneABC, ticks) {
        abcStopped = false;
        instrument.silence();
        instrument.play({
                tempo: ticks,
            },
            tuneABC,
            function () {
                loopABCplayer(tuneABC, ticks);
            }
        );
        abcCurrentTime = 0;
        currentABCSlider.noUiSlider.set(0);
        intervalHandle = setInterval(nudgeABCSlider, 300);
    }

    function stopABCplayer() {
        clearInterval(intervalHandle);
        currentABCSlider.noUiSlider.set(0);
        abcStopped = true;
        instrument.silence();
    }

    function loopABCplayer(tuneABC, ticks) {
        instrument.silence();
        clearInterval(intervalHandle);

        if (abcStopped == false) {
            startABCplayer(tuneABC, ticks);
        }
    }

    function nudgeABCSlider() {
        abcCurrentTime += 0.3;
        currentABCSlider.noUiSlider.set(abcCurrentTime);
    }

    function createABCSliders(tuneID) {
        let audioSlider = document.getElementById(`audioSliderABC${tuneID}`);
        let speedSlider = document.getElementById(`speedSliderABC${tuneID}`);

        noUiSlider.create(audioSlider, {
            start: [0],
            connect: [true, false],
            tooltips: [
                wNumb({
                    decimals: 1,
                }),
            ],
            range: {
                min: [0],
                max: [100],
            },
        });

        noUiSlider.create(speedSlider, {
            start: [100],
            connect: [true, false],
            step: 5,
            tooltips: [
                wNumb({
                    decimals: 0,
                    prefix: "Speed: ",
                    postfix: " %",
                }),
            ],
            range: {
                min: 50,
                max: 120,
            },
        });

    }

    function getABCheaderValue(key, tuneABC) {
        // Extract the value of one of the ABC keywords e.g. T: Out on the Ocean
        const KEYWORD_PATTERN = new RegExp(`^\\s*${key}`);

        const lines = tuneABC.split(/[\r\n]+/).map(line => line.trim());
        const keyIdx = lines.findIndex(line => line.match(KEYWORD_PATTERN));
        if (keyIdx < 0) {
            return '';
        } else {
            return lines[keyIdx].split(":")[1].trim();
        }
    }

    function preProcessABC(tuneABC) {
        /*
         * Our simple ABC player doesn't handle repeats well.
         * preProcessABC expands the repeats in the ABC so that things play better.
         */

        // Clean out any lines of lyrics from the ABC (starts with 'w:')
        const abcNotes = tuneABC.match(/^(?!w:).+$/gm).join('\n');

        let firstBar = /\|/g,
            fEnding = /\|1/g,
            fEnding2 = /\[1/g,
            sEnding = /\|2/g,
            sEnding2 = /\[2/g,
            lRepeat = /\|:/g,
            rRepeat = /:\|/g,
            dblBar = /\|\|/g,
            dblBar2 = /\|\]/g;
        let match,
            fBarPos = [],
            fEndPos = [],
            sEndPos = [],
            lRepPos = [],
            rRepPos = [],
            dblBarPos = [];
        let tokenString = [],
            tokenLocations = [],
            tokenCount = 0,
            sortedTokens = [],
            sortedTokenLocations = [];
        let position = 0;
        let expandedABC = "";

        while ((match = firstBar.exec(abcNotes)) != null) {
            fBarPos.push(match.index);
        }
        tokenString[tokenCount] = "fb";
        if (fBarPos[0] > 6) {
            fBarPos[0] = 0;
        }
        // first bar
        tokenLocations[tokenCount++] = fBarPos[0];
        while (
            ((match = fEnding.exec(abcNotes)) || (match = fEnding2.exec(abcNotes))) !=
            null
        ) {
            fEndPos.push(match.index);
            tokenString[tokenCount] = "fe";
            // first endings
            tokenLocations[tokenCount++] = match.index;
        }
        while (
            ((match = sEnding.exec(abcNotes)) || (match = sEnding2.exec(abcNotes))) !=
            null
        ) {
            sEndPos.push(match.index);
            tokenString[tokenCount] = "se";
            // second endings
            tokenLocations[tokenCount++] = match.index;
        }
        while ((match = rRepeat.exec(abcNotes)) != null) {
            rRepPos.push(match.index);
            tokenString[tokenCount] = "rr";
            // right repeats
            tokenLocations[tokenCount++] = match.index;
        }
        while ((match = lRepeat.exec(abcNotes)) != null) {
            lRepPos.push(match.index);
            tokenString[tokenCount] = "lr";
            // left repeats
            tokenLocations[tokenCount++] = match.index;
        }
        while (
            ((match = dblBar.exec(abcNotes)) || (match = dblBar2.exec(abcNotes))) !=
            null
        ) {
            dblBarPos.push(match.index);
            tokenString[tokenCount] = "db";
            // double bars
            tokenLocations[tokenCount++] = match.index;
        }
        tokenString[tokenCount] = "lb";
        // last bar
        tokenLocations[tokenCount++] = fBarPos[fBarPos.length - 1];

        let indices = tokenLocations.map(function (elem, index) {
            return index;
        });
        indices.sort(function (a, b) {
            return tokenLocations[a] - tokenLocations[b];
        });

        for (let i = 0; i < tokenLocations.length; i++) {
            sortedTokens[i] = tokenString[indices[i]];
            sortedTokenLocations[i] = tokenLocations[indices[i]];
        }

        for (let i = 0; i < sortedTokens.length; i++) {
            // safety check - is 1000 enough? ASJL 2020/11/23
            if (expandedABC.length > 1000) {
                break;
            }
            // find next repeat or second ending
            if (sortedTokens[i] == "rr" || sortedTokens[i] == "se") {
                //notes from last location to rr or se
                expandedABC += abcNotes.substr(position, sortedTokenLocations[i] - position);
                // march backward from there
                for (let j = i - 1; j >= 0; j--) {
                    // check for likely loop point
                    if (
                        sortedTokens[j] == "se" ||
                        sortedTokens[j] == "rr" ||
                        sortedTokens[j] == "fb" ||
                        sortedTokens[j] == "lr"
                    ) {
                        // mark loop beginning point
                        position = sortedTokenLocations[j];
                        // walk forward from there
                        for (let k = j + 1; k < sortedTokens.length; k++) {
                            // walk to likely stopping point (first ending or repeat)
                            if (sortedTokens[k] == "fe" || sortedTokens[k] == "rr") {
                                expandedABC += abcNotes.substr(
                                    position,
                                    sortedTokenLocations[k] - position
                                );
                                // mark last position encountered
                                position = sortedTokenLocations[k];
                                // consume tokens from big loop
                                i = j + 1;
                                // if we got to a first ending we have to skip it..
                                if (sortedTokens[k] == "fe") {
                                    // walk forward from here until the second ending
                                    for (let l = k; l < sortedTokens.length; l++) {
                                        if (sortedTokens[l] == "se") {
                                            // look for end of second ending
                                            for (let m = l; m < sortedTokens.length; m++) {
                                                // a double bar marks the end of a second ending
                                                if (sortedTokens[m] == "db") {
                                                    // record second ending
                                                    expandedABC += abcNotes.substr(
                                                        sortedTokenLocations[l],
                                                        sortedTokenLocations[m] - sortedTokenLocations[l]
                                                    );
                                                    //mark most forward progress
                                                    position = sortedTokenLocations[m];
                                                    // consume the tokens from the main loop
                                                    i = m + 1;
                                                    // quit looking
                                                    break;
                                                }
                                            } // END of for m loop
                                            // consume tokens TED: CHECK THIS
                                            i = l + 1;
                                            // quit looking
                                            break;
                                        }
                                    } // END of for l loop
                                } // END of first ending we have to skip it
                                break;
                            }
                        } // END of for k loop
                        break;
                    } // END of check for likely loop point
                } // END of for j loop
            } // END of check for likely loop point
        } // END of for i loop

        expandedABC += abcNotes.substr(position, sortedTokenLocations[sortedTokens.length - 1] - position);

        // remove chords
        expandedABC = expandedABC.replace(/[“”″]/g, "\"");
        expandedABC = expandedABC.replace(/".*?"/g, "");
        // insert blank line before T: field
        expandedABC = expandedABC.replace(/\|[\n\r]T:/g, "|\n\nT:");
        // collapse note lines into one
        expandedABC = expandedABC.replace(/\|[\n\r]/g, "|");

        // Clean up the ABC repeat markers - we don't need them now!
        expandedABC = expandedABC.replace(/:\|/g, "|");
        expandedABC = expandedABC.replace(/\|:/g, "|");
        expandedABC = expandedABC.replace(/::/g, "|");
        expandedABC = expandedABC.replace(/\|+/g, "|");
        expandedABC = expandedABC.replace(/:$/, "|");
        expandedABC = expandedABC.replace(/:"$/, "|");

        //console.log(expandedABC);

        return expandedABC + "\n";
    }

    // abcjs doesn't like quotes other than "0x22" for chords
    // so WordPress wptextuarize() breaks ABC chord notation
    // this isn't a complete reversal - just the double quotes
    // the issue is discussed in https://github.com/WordPress/gutenberg/issues/37754
    // ideally we'd be able to use the hook:
    // https://developer.wordpress.org/reference/hooks/no_texturize_shortcodes/
    // to stop WordPress mangling the ABC for specific shortcodes
    function unwptextuarize(textareaID) {
        let abc = document.getElementById(textareaID).value.replace(/[“”″]/g, "\"");
        document.getElementById(textareaID).value = abc;
    }

    function displayABCmusic(uniqID) {
        let textareaID = `abc-textarea-${uniqID}`;
        let paperID = `abc-paper-${uniqID}`;

        unwptextuarize(textareaID);

        // Draw the dots with the player
        let abcEditor = new window.ABCJS.Editor(textareaID, {
            paper_id: paperID,
            warnings_id: "warnings",
            render_options: {
                responsive: 'resize'
            },
            indicate_changed: "true",
        });
    }

    function displayABCplayer(uniqID) {
        let textareaID = `abc-textarea-${uniqID}`;
        let paperID = `abc-paper-${uniqID}`;
        let audioID = `abc-audio-${uniqID}`;

        unwptextuarize(textareaID);

        let cursorControl = new CursorControl(paperID);

        // Draw the dots with the player
        let abcEditor = new window.ABCJS.Editor(textareaID, {
            paper_id: paperID,
            warnings_id: "warnings",
            render_options: {
                responsive: 'resize'
            },
            indicate_changed: "true",
            synth: {
                el: `#${audioID}`,
                cursorControl,
                options: {
                    displayLoop: true,
                    displayRestart: true,
                    displayPlay: true,
                    displayProgress: true,
                    displayWarp: true
                }
            }
        });
    }

    function displayABCeditor(uniqID) {
        let textareaID = `abc-textarea-${uniqID}`;
        let paperID = `abc-paper-${uniqID}`;
        let warningsID = `abc-warnings-${uniqID}`;
        let audioID = `abc-audio-${uniqID}`;

        let cursorControl = new CursorControl(paperID);

        // Draw the dots with the player
        let abcEditor = new window.ABCJS.Editor(textareaID, {
            paper_id: paperID,
            warnings_id: warningsID,
            render_options: {
                responsive: 'resize'
            },
            indicate_changed: "true",
            synth: {
                el: `#${audioID}`,
                cursorControl,
                options: {
                    displayLoop: true,
                    displayRestart: true,
                    displayPlay: true,
                    displayProgress: true,
                    displayWarp: true
                }
            }
        });
    }

    class CursorControl {
        constructor(paperID) {
            let self = this;

            self.onStart = function () {
                let svg = document.querySelector(`#${paperID} svg`);
                let cursor = document.createElementNS("http://www.w3.org/2000/svg", "line");
                cursor.setAttribute("class", "abcjs-cursor");
                cursor.setAttributeNS(null, 'x1', 0);
                cursor.setAttributeNS(null, 'y1', 0);
                cursor.setAttributeNS(null, 'x2', 0);
                cursor.setAttributeNS(null, 'y2', 0);
                svg.appendChild(cursor);
            };
            self.onEvent = function (ev) {
                if (ev.measureStart && ev.left === null)
                    return; // this was the second part of a tie across a measure line. Just ignore it.

                let lastSelection = document.querySelectorAll(`#${paperID} svg .highlight`);
                for (let k = 0; k < lastSelection.length; k++)
                    lastSelection[k].classList.remove("highlight");

                let cursor = document.querySelector(`#${paperID} svg .abcjs-cursor`);
                if (cursor) {
                    cursor.setAttribute("x1", ev.left - 2);
                    cursor.setAttribute("x2", ev.left - 2);
                    cursor.setAttribute("y1", ev.top);
                    cursor.setAttribute("y2", ev.top + ev.height);
                }
            };
            self.onFinished = function () {
                let els = document.querySelectorAll("svg .highlight");
                for (let i = 0; i < els.length; i++) {
                    els[i].classList.remove("highlight");
                }
                let cursor = document.querySelector(`#${paperID} svg .abcjs-cursor`);
                if (cursor) {
                    cursor.setAttribute("x1", 0);
                    cursor.setAttribute("x2", 0);
                    cursor.setAttribute("y1", 0);
                    cursor.setAttribute("y2", 0);
                }
            };
        }
    }

    function downloadABCFile(text) {
        // set the filename for downloading
        let filename = slugify(getABCheaderValue("T:", text)) + ".abc";

        downloadFile(filename, text);
    }

    function downloadFile(filename, text) {
        let pom = document.createElement("a");
        pom.setAttribute(
            "href",
            "data:application/download;charset=utf-8," +
            encodeURIComponent(text)
        );
        pom.setAttribute("download", filename);

        if (document.createEvent) {
            let event = document.createEvent("MouseEvents");
            event.initEvent("click", true, true);
            pom.dispatchEvent(event);
        } else {
            pom.click();
        }
    }

    // https://lucidar.me/en/web-dev/how-to-slugify-a-string-in-javascript/
    function slugify(str) {
        str = str.replace(/^\s+|\s+$/g, '');

        // Make the string lowercase
        str = str.toLowerCase();

        // Remove accents, swap ñ for n, etc
        var from = "ÁÄÂÀÃÅČÇĆĎÉĚËÈÊẼĔȆÍÌÎÏŇÑÓÖÒÔÕØŘŔŠŤÚŮÜÙÛÝŸŽáäâàãåčçćďéěëèêẽĕȇíìîïňñóöòôõøðřŕšťúůüùûýÿžþÞĐđßÆa·/_,:;";
        var to = "AAAAAACCCDEEEEEEEEIIIINNOOOOOORRSTUUUUUYYZaaaaaacccdeeeeeeeeiiiinnooooooorrstuuuuuyyzbBDdBAa------";
        for (var i = 0, l = from.length; i < l; i++) {
            str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
        }

        // Remove invalid chars
        str = str.replace(/[^a-z0-9 -]/g, '')
            // Collapse whitespace and replace by -
            .replace(/\s+/g, '-')
            // Collapse dashes
            .replace(/-+/g, '-');

        return str;
    }

    function getABCheaderValue(key, tuneABC) {
        // Extract the value of one of the ABC keywords e.g. T: Out on the Ocean
        const KEYWORD_PATTERN = new RegExp(`^\\s*${key}`);

        const lines = tuneABC.split(/[\r\n]+/).map(line => line.trim());
        const keyIdx = lines.findIndex(line => line.match(KEYWORD_PATTERN));
        if (keyIdx < 0) {
            return '';
        } else {
            return lines[keyIdx].split(":")[1].trim();
        }
    }

    return {
        createMP3player: createMP3player,
        createAudioSliders: createAudioSliders,
        playAudio: playAudio,
        setFromSlider: setFromSlider,
        setToSlider: setToSlider,
        resetFromToSliders: resetFromToSliders,
        createABCplayer: createABCplayer,
        createABCSliders: createABCSliders,
        playABC: playABC,
        changeABCspeed: changeABCspeed,
        displayABCmusic: displayABCmusic,
        displayABCplayer: displayABCplayer,
        displayABCeditor: displayABCeditor,
        downloadABCFile: downloadABCFile,
    };
})();

if (typeof module !== "undefined" && module.exports) {
    module.exports = choon;
}
