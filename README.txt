=== Choon Player ===
Contributors: asjl
Tags: music choon loop slow-down
Requires at least: 5.5
Tested up to: 6.6.2
Stable tag: 2.2.2
Requires PHP: 7.0
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Include an audio player that supports loops and slowing down music by specifying the URL of the music in a shortcode.

== Description ==

Choon Player is a simple audio player that supports loops and slowing down music for learning by ear. It was developed for learning Irish Traditional music. The plugin also supports the display of ABC notation as standard music notation by including Paul Rosen's ABCJS library. That plugin has many more features than this software but was overkill for what I wanted! 

The supported shortcodes are:

1. A player for MP3 files. To display the player, put a valid URL pointing to an MP3 or M4A recording between the shortcodes [choon] and [/choon] on your page or post.

2. You can display the musical notation derived from ABC notation combined with a player. Put valid ABC notation between the shortcodes [choon-abcjs-player] and [/choon-abcjs-player] on your page or post.

As an alternative to option 2 you can use a combination of the following two shortcodes.

3. A player for ABC notation. To display the player put ABC notation between the shortcodes [choon-abc] and [/choon-abc]. This option is based on an older now unsupported library called 'musical.js' which may have issues in future. This is still included for now - you may want to replace any current use with [choon-abcjs-player].

4. To simply produce sheet music, put a valid ABC notation string between the shortcodes [choon-abcjs-music] and [/choon-abcjs-music] on your page or post. You can use this option in combination with [choon-abc] to show music notation on the same page.

5. If you want a simple ABC editor on your WordPress page then including the tags [choon-abcjs-editor] and [/choon-abcjs-editor] will draw a 'textarea' on the page where you can input ABC notation.

Previous versions of this code had shortcode tags of
[abcjs-tools-music], [abcjs-tools-player] and [abcjs-tools-editor].
These are retained for backwards compatibility but have been superceded by options 2, 4 and 5 above. Use the new codes!

== Screenshots ==

1. screenshot-1.png
2. screenshot-2.png

== Installation ==

* Download the WordPress plugin available from https://wordpress.org/plugins/choon-player/

or

* Activate the plugin through the 'Plugins' menu in WordPress.

== Frequently Asked Questions ==

Not yet!

== Where can this be used? ==

Anywhere that shortcodes are accepted. Tested on pages and posts but
not on widgets (using the Twenty Twenty-Three theme). Some CSS adjustment likely needed with other themes.

== How does it work? ==

The plugin includes the Choon Player JavaScript library. The URL or ABC notation that is put in the shortcode is passed to the relevant library, which places the player on the page instead of the shortcode.

See [https://lpnz.org/choon-player-overview/](https://lpnz.org/choon-player-overview/) for usage examples.

= What can be put in the url that is placed in the [choon] shortcode? =

A pointer to an MP3 file. Other audio formats supported by the HTML5 audio player should also work.

= What can be put in the block of text that is placed in the [choon-abc] and [choon-abcjs-*] shortcodes? =

A block of valid ABC text. See [https://thesession.org](https://thesession.org) for examples.

See [https://abcnotation.com/wiki/abc:standard:v2.2](https://abcnotation.com/wiki/abc:standard:v2.2) for a more a comprehensive description of the ABC format.

= What parameters may be used? =

At this stage, none!

== Thanks ==

Special thanks to Paul Rosen for all his work on [abcjs](http://abcjs.net/). The WordPress plugin parts of this code were based on his excellent ABC Notation plugin. Any bugs or features are all my own work!

The javascript code for the [choon] player was based on the players used on the [New Zealand Irish Sessions](https://irish.session.nz) site.

== Changelog ==

= 0.0.1 =
* Initial version

= 0.0.2 =
* Minor tidyup of php code to simplify it

= 0.0.3 =
* Now supports more than one tune per page - lots of tunes on the same page are not a good idea!

= 0.0.4 =
* Add a 'choon' prefix to function and other variable names to avoid clashes
* Load additional libraries from local sources

= 0.0.5 =
* Minor changes to support Choon Player's addition to the Wordpress
plugin scheme

= 0.0.6 =
* Added support for URLs with non-ASCII characters e.g. accents in
Irish, Scots Gaelic etc

= 0.0.7 =
* Fixed the link to the "play" and "pause" buttons

= 0.0.8 =
* updated choon-player.js to use "module.exports"

= 0.1.0 =
* added support for a simple ABC player with similar features to the MP3 player

= 0.1.1 =
* strip any lyrics from ABC notation (lines that start with 'w:') as
they mess up tune length calculations

= 0.1.2 =
* fix version number

= 0.1.3 =
* add to documentation

= 0.2.0 =
* upgrade code to allow more than one instance of the shortcodes of each page

= 0.2.1 =
* remove unwanted parametes from some functions

= 0.2.2 =
* tested against WordPress 5.7

= 0.2.3 =
* Improve playback of multiple ABC tunes in a single [choon-abc] tag

= 0.2.4 =
* Explicitly load MP3 file on playback - avoids long session with webserver

= 0.2.5 =
* Add pointer to documentation examples on https://lpnz.org + tested up to WP 5.9.1

= 0.3.0 =
* Add code for displaying ABC notation as "dots" + tested  up to WP 5.9.3

= 1.0.0 =
* Add code for displaying ABC notation as "dots" + tested  up to WP 5.9.3

= 1.0.1 =
* Fixing missing files

= 1.0.2 =
* Added Download ABC option to [choon-abcjs-editor] shortcode

= 2.0.0 =
* Merge abcjs-tools code more closely to avoid loading three separate .js files

= 2.0.1 =
* Tested with WP 6.4

= 2.0.2 =
* Fixed css for Download ABC button

= 2.0.3 =
* Fixed release number

= 2.1.0 =
* Added playback cursor for ABC player and editor shortcodes

= 2.1.1 =
* Fixed slider width

= 2.1.2 =
* Fixing release number 

= 2.1.3 =
* Fixing release number (again)

= 2.1.4 =
* Left hand slider margin patched

= 2.1.5 =
* Converted <input type="button"> HTML tags to <button> tags

= 2.1.6 =
* Fixed multiple players on same page interacting with each other and added version numbers to loading of js and css files

= 2.1.7 =
* Added patch to deal with abcjs doesn't like quotes for chords other than "0x22"

= 2.1.8 =
* Fix version numbers

= 2.1.9 =
* Refine and document 2.1.7 patch

= 2.2.0 =
* Upgraded abcjs to 6.4.0

= 2.2.1 =
* Upgraded abcjs to 6.4.1

= 2.2.2 =
* Upgraded abcjs to 6.4.3

== Upgrade Notice ==

= 2.2.2 =
* Upgraded abcjs to 6.4.3
