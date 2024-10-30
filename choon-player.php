<?php
/*
Plugin Name: Choon Player
Version: 2.2.2
Description: Toolkit for learning music by ear - written with Irish Traditional music in mind. Play tunes in a loop with an option to slow down the playback speed without changing pitch. Also can be used to display music written in ABC format as a support for learning.
Author: Andy Linton
Author URI: https://lpnz.org
License: GPL version 2 or later - http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
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

defined('ABSPATH') or die('No script kiddies please!');

//
//-- Add the javascript and css if there is a shortcode on the page.
//
function choon_conditionally_load_resources($posts)
{
    if (empty($posts)) {
        return $posts;
    }
    $has_choon = false;
    foreach ($posts as $post) {
        if (str_contains($post->post_content, '[choon')
            || str_contains($post->post_content, '[abcjs-tools')) {
            $has_choon = true;
            break;
        }
    }

    $plugin_url = plugin_dir_url(__FILE__);
    $plugin_dir = plugin_dir_path(__FILE__);

    if ($has_choon) {
        // Javascript and CSS libraries

        // See https://github.com/paulrosen/abcjs
        $version = filemtime($plugin_dir . 'js/abcjs-basic-min.js');
        wp_enqueue_script('abcjs-plugin', plugins_url('/js/abcjs-basic-min.js', __FILE__), array(), $version);

        // See https://github.com/paulrosen/abcjs
        $version = filemtime($plugin_dir . 'css/abcjs-audio.css');
        wp_enqueue_style('abcjs-tools', $plugin_url . 'css/abcjs-audio.css', array(), $version);

        // See https://cdnjs.com/libraries/wnumb
        $version = filemtime($plugin_dir . '/js/wNumb.min.js');
        wp_enqueue_script('wNumb', plugins_url('/js/wNumb.min.js', __FILE__), array(), $version);

        // See https://github.com/leongersen/noUiSlider/releases/tag/15.7.1
        $version = filemtime($plugin_dir . 'css/nouislider.min.css');
        wp_enqueue_style('noUiSlider', $plugin_url . 'css/nouislider.min.css', array(), $version);

        // See https://github.com/leongersen/noUiSlider/releases/tag/15.7.1
        $version = filemtime($plugin_dir . '/js/nouislider.min.js');
        wp_enqueue_script('noUiSlider', plugins_url('/js/nouislider.min.js', __FILE__), array(), $version);

        // See https://github.com/PencilCode/musical.js
        $version = filemtime($plugin_dir . 'js/musical.min.js');
        wp_enqueue_script('musical', plugins_url('/js/musical.min.js', __FILE__), array(), $version);

        // The choon-player CSS
        $version = filemtime($plugin_dir . 'css/choon-player.css');
        wp_enqueue_style('choon-player', $plugin_url . 'css/choon-player.css', array(), $version);

        // The choon-player code
        $version = filemtime($plugin_dir . 'js/choon-player.js');
        wp_enqueue_script('choon-player', plugins_url('/js/choon-player.js', __FILE__), array(), $version);
    }

    return $posts;
}
add_filter('the_posts', 'choon_conditionally_load_resources');

//
//-- Interpret the [choon] shortcode
//
function choon_create_player($atts = [], $content)
{
    // php doesn't handle non-ASCII characters at all well
    // that's a problem for names in Irish (and other languages)
    // this encodes non-ASCII chars before calling filter_var
    $path = parse_url($content, PHP_URL_PATH);
    $encoded_path = array_map('urlencode', explode('/', $path));
    $content = str_replace($path, implode('/', $encoded_path), $content);

    // the [choon] tag is used to pass in this URL
    $url = filter_var($content, FILTER_SANITIZE_URL);

    static $tuneID = 1;
    if ($tuneID == 1) {
        // create the audioplayer once
        $output = <<<AUDIOPLAYER

        <!-- Start of Choon audioPlayer code -->
        <div id="player">
            <audio id="choonAudioPlayer">
                <source id="choon-MP3Source" type="audio/mp3">
                Your browser does not support the audio format.
            </audio>
        </div>
        <!-- End of Choon audioPlayer code -->

        AUDIOPLAYER;
    } else {
        $output = '';
    }

    // Make a new div for each tune on a page
    $output .= <<<MP3PLAYER

    <!-- Start of Choon MP3 Player $tuneID code -->
    <div id="choonMP3Player$tuneID"></div>
    <script type="text/javascript">
    choonMP3Player$tuneID.innerHTML = choon.createMP3player("$tuneID", "$url");
    choon.createAudioSliders("$tuneID");
    </script>
    <!-- End of Choon MP3 Player $tuneID code -->

    MP3PLAYER;

    $tuneID++;

    return $output;
}
add_shortcode('choon', 'choon_create_player');

//
// Interpret the [choon-abc] shortcode
//
function choon_abc_create_player($atts = [], $abc)
{
    static $tuneID = 1;

    $abc = strip_tags($abc);

    $output = <<<ABCPLAYER

    <!-- Start of Choon ABC Player $tuneID  code -->
    <div id="choonABCplayer$tuneID"></div>

    <!-- hidden textarea for the ABC notation -->
    <textarea id="choonTextArea$tuneID" style="display:none;">$abc</textarea>

    <script type="text/javascript">
    choonABCplayer$tuneID.innerHTML = choon.createABCplayer("choonTextArea$tuneID", "$tuneID", "piano");
    choon.createABCSliders("$tuneID");
    </script>
    <!-- End of Choon ABC Player $tuneID code -->

    ABCPLAYER;

    $tuneID++;

    return $output;
}
add_shortcode('choon-abc', 'choon_abc_create_player');

//
//-- Interpret the [choon-abcjs-music] shortcode
//
function abcjs_tools_create_music($atts, $abc)
{
    $abc = strip_tags($abc);

    $uniqID = uniqid();

    $output = '';
    $output .= <<<ABCTEMPLATE

    <!-- Start of ABCJS music code -->
    <div>
        <!-- display the dots -->
        <div id="abc-paper-$uniqID" class="abc-paper abcjs-tune-number-0"></div>
        <div id="abc-audio-$uniqID"></div>

        <!-- hidden textarea for the ABC notation -->
        <textarea id="abc-textarea-$uniqID" class="choon-abc-hide" rows="14" spellcheck="false">$abc</textarea>
    </div>
    <script type="text/javascript">
    choon.displayABCmusic("$uniqID");
    </script>
    <!-- End of ABCJS music code -->

ABCTEMPLATE;

    return $output;
}
add_shortcode('choon-abcjs-music', 'abcjs_tools_create_music');
// Old style shortcode from version 1 - deprecated
add_shortcode('abcjs-tools-music', 'abcjs_tools_create_music');

//
//-- Interpret the [choon-abcjs-player] shortcode
//
function abcjs_tools_create_player($atts, $abc)
{
    $abc = strip_tags($abc);

    $uniqID = uniqid();

    $output = '';
    $output .= <<<ABCTEMPLATE

    <!-- Start of ABCJS music code -->
    <div>
         <!-- display the dots -->
         <div id="abc-paper-$uniqID" class="abc-paper abcjs-tune-number-0"></div>
         <div id="abc-audio-$uniqID"></div>

         <!-- hidden textarea for the ABC notation -->
         <textarea id="abc-textarea-$uniqID" class="choon-abc-hide" rows="14" spellcheck="false">$abc</textarea>
    </div>

    <script type="text/javascript">
    choon.displayABCplayer("$uniqID");
    </script>
    <!-- End of ABCJS music code -->

ABCTEMPLATE;

    return $output;

}
add_shortcode('choon-abcjs-player', 'abcjs_tools_create_player');
// Old style shortcode from version 1 - deprecated
add_shortcode('abcjs-tools-player', 'abcjs_tools_create_player');

//
//-- Interpret the [choon-abcjs-editor] shortcode
//
function abcjs_tools_create_editor($atts, $content)
{

    $uniqID = uniqid();

    $output = '';
    $output .= <<<ABCTEMPLATE

    <!-- Start of ABCJS music code -->
    <div>
        <!-- display the dots -->
        <div id="abc-paper-$uniqID" class="abc-paper abcjs-tune-number-0"></div>
        <div id="abc-audio-$uniqID"></div>
        <div id="abc-warnings-$uniqID"></div>

        <!-- visible textarea for the ABC notation -->
        <textarea id="abc-textarea-$uniqID" class="choon-abc-show" rows="14" spellcheck="false"></textarea>

        <!-- download button for any changes -->
        <div title="Download the ABC you've entered. Don't lose your work!">
            <button class="choon-loopButton"
            onclick='choon.downloadABCFile(document.getElementById("abc-textarea-$uniqID").value)'>Download ABC</button>
        </div>
    </div>

    <script type="text/javascript">
    choon.displayABCeditor("$uniqID");
    </script>
    <!-- End of ABCJS music code -->

ABCTEMPLATE;

    return $output;
}
add_shortcode('choon-abcjs-editor', 'abcjs_tools_create_editor');
// Old style shortcode from version 1 - deprecated
add_shortcode('abcjs-tools-editor', 'abcjs_tools_create_editor');
