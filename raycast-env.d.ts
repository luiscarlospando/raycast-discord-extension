/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `open-channels` command */
  export type OpenChannels = ExtensionPreferences & {}
  /** Preferences accessible in the `search-messages` command */
  export type SearchMessages = ExtensionPreferences & {}
  /** Preferences accessible in the `unread-messages` command */
  export type UnreadMessages = ExtensionPreferences & {}
  /** Preferences accessible in the `toggle-notifications` command */
  export type ToggleNotifications = ExtensionPreferences & {}
  /** Preferences accessible in the `set-status` command */
  export type SetStatus = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `open-channels` command */
  export type OpenChannels = {}
  /** Arguments passed to the `search-messages` command */
  export type SearchMessages = {}
  /** Arguments passed to the `unread-messages` command */
  export type UnreadMessages = {}
  /** Arguments passed to the `toggle-notifications` command */
  export type ToggleNotifications = {}
  /** Arguments passed to the `set-status` command */
  export type SetStatus = {}
}

