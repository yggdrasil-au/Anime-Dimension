// /source/ts/capacitorinit.ts

declare global {
    var PLATFORM: string;
    var EventBus: {
        events: { [key: string]: ((data?: unknown) => void)[] };
        emittedEvents: { [key: string]: unknown };
        on(event: string, callback: (data?: unknown) => void): void;
        emit(event: string, data?: unknown): void;
    };
    var App: {
        Capacitor: typeof Capacitor;
        CapacitorSQLite: typeof CapacitorSQLite;
        SQLiteConnection: typeof SQLiteConnection;
        ActionSheet: typeof ActionSheet;
        CapApp: typeof CapApp;
        AppLauncher: typeof AppLauncher;
        BackgroundRunner: typeof BackgroundRunner;
        BarcodeScanner: typeof CapacitorBarcodeScanner;
        Browser: typeof Browser;
        Camera: typeof Camera;
        Clipboard: typeof Clipboard;
        Device: typeof Device;
        Dialog: typeof Dialog;
        FileTransfer: typeof FileTransfer;
        FileViewer: typeof FileViewer;
        FileSystem: typeof Filesystem;
        Geolocation: typeof Geolocation;
        Haptics: typeof Haptics;
        InappBrowser: typeof InAppBrowser;
        Keyboard: typeof Keyboard;
        LocalNotifications: typeof LocalNotifications;
        Network: typeof Network;
        Preferences: typeof Preferences;
        PrivacyScreen: typeof PrivacyScreen;
        PushNotifications: typeof PushNotifications;
        ScreenOrientation: typeof ScreenOrientation;
        ScreenReader: typeof ScreenReader;
        Share: typeof Share;
        SplashScreen: typeof SplashScreen;
        StatusBar: typeof StatusBar;
        Toast: typeof Toast;
    };
}

globalThis.EventBus = {
    events: {},
    emittedEvents: {},

    /**
     * Registers a listener for an event.
     * If the event has already been emitted, the callback is called immediately.
     * @param {string} event The event name.
     * @param {function} callback The listener function.
     */
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
        console.debug(`[AD::capacitorinit.ts::EventBus] New listener registered for event: "${event}"`);

        // If the event was already emitted, call the listener immediately with the stored data
        if (Object.hasOwn(this.emittedEvents, event)) {
            console.debug(`[AD::capacitorinit.ts::EventBus] Immediately invoking late listener for event: "${event}"`);
            try {
                callback(this.emittedEvents[event]);
            } catch (error) {
                console.error(`[AD::capacitorinit.ts::EventBus] Error in late listener for event "${event}":`, error);
            }
        }
    },

    /**
     * Emits an event and stores its data.
     * @param {string} event The event name.
     * @param {*} [data] Optional data to pass to the listeners.
     */
    emit(event, data) {
        if (Object.hasOwn(this.emittedEvents, event)) {
            console.warn(`[AD::capacitorinit.ts::EventBus] Event "${event}" has already been emitted. Ignoring subsequent emit.`);
            return; // Prevent multiple emits for the same event
        }

        console.debug(`[AD::capacitorinit.ts::EventBus] Emitting event: "${event}"`, data || '');
        this.emittedEvents[event] = data;

        if (this.events[event]) {
            this.events[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[AD::capacitorinit.ts::EventBus] Error in listener for event "${event}":`, error);
                }
            });
        }
    },
};

import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader';
jeepSqlite(window);

// core
import { Capacitor } from '@capacitor/core';
// plugins
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { ActionSheet, ActionSheetButtonStyle, ActionSheetOptionStyle } from '@capacitor/action-sheet';
import { App as CapApp } from '@capacitor/app';
import { AppLauncher } from '@capacitor/app-launcher';
import { BackgroundRunner } from '@capacitor/background-runner';
import { CapacitorBarcodeScanner, CapacitorBarcodeScannerAndroidScanningLibrary, CapacitorBarcodeScannerCameraDirection, CapacitorBarcodeScannerScanOrientation, CapacitorBarcodeScannerTypeHint, CapacitorBarcodeScannerTypeHintALLOption } from '@capacitor/barcode-scanner';
import { Browser } from '@capacitor/browser';
import { Camera, CameraDirection, CameraResultType, CameraSource } from '@capacitor/camera';
import { Clipboard } from '@capacitor/clipboard';
import { Device } from '@capacitor/device';
import { Dialog } from '@capacitor/dialog';
import { FileTransfer } from '@capacitor/file-transfer';
import { FileViewer } from '@capacitor/file-viewer';
import { Directory, Encoding, Filesystem, FilesystemDirectory, FilesystemEncoding } from '@capacitor/filesystem';
import { Geolocation } from '@capacitor/geolocation';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { AndroidAnimation, AndroidViewStyle, DefaultAndroidSystemBrowserOptions, DefaultAndroidWebViewOptions, DefaultSystemBrowserOptions, DefaultWebViewOptions, DefaultiOSSystemBrowserOptions, DefaultiOSWebViewOptions, DismissStyle, InAppBrowser, ToolbarPosition, iOSAnimation, iOSViewStyle } from '@capacitor/inappbrowser';
import { Keyboard, KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';
import { LocalNotifications, Weekday } from '@capacitor/local-notifications';
import { Network } from '@capacitor/network';
import { Preferences } from '@capacitor/preferences';
import { PrivacyScreen } from '@capacitor/privacy-screen';
import { PushNotifications } from '@capacitor/push-notifications';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { ScreenReader } from '@capacitor/screen-reader';
import { Share } from '@capacitor/share';
import { SplashScreen } from '@capacitor/splash-screen';
import { Animation, StatusBar, StatusBarAnimation, StatusBarStyle, Style } from '@capacitor/status-bar';
import { Toast } from '@capacitor/toast';

try {
    // Assign all plugins to a single global object
    globalThis.App = {
        Capacitor, CapacitorSQLite, SQLiteConnection, ActionSheet, CapApp, AppLauncher,
        BackgroundRunner, BarcodeScanner: CapacitorBarcodeScanner, Browser, Camera,
        Clipboard, Device, Dialog, FileTransfer, FileViewer, FileSystem: Filesystem,
        Geolocation, Haptics, InappBrowser: InAppBrowser, Keyboard, LocalNotifications,
        Network, Preferences, PrivacyScreen, PushNotifications, ScreenOrientation,
        ScreenReader, Share, SplashScreen, StatusBar, Toast,
    };

    window.PLATFORM = globalThis.App.Capacitor.getPlatform();
    // EMIT event to the bus instead of using document.dispatchEvent
    window.EventBus.emit('capacitorReady');
    console.debug("[AD::capacitorinit.ts::(global)] Capacitor and plugins initialized. 'capacitorReady' event emitted.");
    // (Optional) Log available plugins
    for (const key in globalThis.App) {
        if (Object.hasOwn(globalThis.App, key)) {
            if (globalThis.App.Capacitor.isPluginAvailable(key)) {
                console.debug(`[AD::capacitorinit.ts::(global)] Plugin ${key} is available on ${window.PLATFORM}`);
            }
            else {
                //console.warn(`{Mobile::04} Plugin ${key} is NOT available on ${window.PLATFORM}`);
            }
        }
    }
} catch (error) {
    console.error("[AD::capacitorinit.ts::(global)] Error initializing Capacitor or plugins:", error);
    window.EventBus.emit('capacitorInitError', error);
}
const onDOMContentLoaded = () => {
    return new Promise<void>(resolve => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
        } else {
            resolve();
        }
    });
};
const onCapacitorReady = () => {
    return new Promise(resolve => {
        // Listen to the event on the bus
        window.EventBus.on('capacitorReady', resolve);
    });
};
// Use an async function to manage the ready states
(async () => {
    console.debug("[AD::capacitorinit.ts::(global)] Waiting for DOM content and Capacitor to be ready...");
    // Wait for both events to complete
    await Promise.all([
        onDOMContentLoaded(),
        onCapacitorReady(),
    ]);
    console.debug('[AD::capacitorinit.ts::(global)] Both DOM and Capacitor are ready. Emitting "DOMandCapReady".');
    // EMIT the combined ready event to the bus
    window.EventBus.emit('DOMandCapReady');
    // Hide splash screen after DOM is ready
    try {
        await globalThis.App.SplashScreen.hide();
        console.debug("[AD::capacitorinit.ts::(global)] Splash screen hidden.");
    } catch (error) {
        console.error("[AD::capacitorinit.ts::(global)] Error hiding splash screen:", error);
    }
})();
