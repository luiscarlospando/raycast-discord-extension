/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Redirect URI - The redirect URI for Discord OAuth */
  "redirectUri": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `index` command */
  export type Index = ExtensionPreferences & {}
  /** Preferences accessible in the `open-channel` command */
  export type OpenChannel = ExtensionPreferences & {}
  /** Preferences accessible in the `search-messages` command */
  export type SearchMessages = ExtensionPreferences & {}
  /** Preferences accessible in the `unread-messages` command */
  export type UnreadMessages = ExtensionPreferences & {}
  /** Preferences accessible in the `toggle-notifications` command */
  export type ToggleNotifications = ExtensionPreferences & {}
  /** Preferences accessible in the `set-status` command */
  export type SetStatus = ExtensionPreferences & {}
  /** Preferences accessible in the `test-auth` command */
  export type TestAuth = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `index` command */
  export type Index = {}
  /** Arguments passed to the `open-channel` command */
  export type OpenChannel = {}
  /** Arguments passed to the `search-messages` command */
  export type SearchMessages = {}
  /** Arguments passed to the `unread-messages` command */
  export type UnreadMessages = {}
  /** Arguments passed to the `toggle-notifications` command */
  export type ToggleNotifications = {}
  /** Arguments passed to the `set-status` command */
  export type SetStatus = {}
  /** Arguments passed to the `test-auth` command */
  export type TestAuth = {}
}

