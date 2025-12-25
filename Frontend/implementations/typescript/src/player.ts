// Copyright Epic Games, Inc. All Rights Reserved.

export * from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.5';
export * from '@epicgames-ps/lib-pixelstreamingfrontend-ui-ue5.5';
import {
    Config,
    Flags,
    NumericParameters,
    PixelStreaming,
    Logger,
    LogLevel
} from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.5';
import { Application, PixelStreamingApplicationStyle } from '@epicgames-ps/lib-pixelstreamingfrontend-ui-ue5.5';
const PixelStreamingApplicationStyles =
    new PixelStreamingApplicationStyle();
PixelStreamingApplicationStyles.applyStyleSheet();

// expose the pixel streaming object for hooking into. tests etc.
declare global {
    interface Window { pixelStreaming: PixelStreaming; }
}

async function fetchRuntimeConfig(): Promise<{ afkSeconds?: number } | null> {
    try {
        const response = await fetch('./runtime-config.json', { cache: 'no-store' });
        if (!response.ok) {
            return null;
        }
        return (await response.json()) as { afkSeconds?: number };
    } catch (_error) {
        return null;
    }
}

document.body.onload = async function() {
    Logger.InitLogging(LogLevel.Warning, true);

    // Create a config object with defaults aligned to legacy behavior.
    const config = new Config({
        useUrlParams: true,
        initialSettings: {
            [Flags.AutoConnect]: true,
            [Flags.MatchViewportResolution]: true,
            [Flags.HoveringMouseMode]: true,
            [Flags.StartVideoMuted]: true,
            [NumericParameters.KeepaliveDelay]: 10000
        }
    });

    const runtimeConfig = await fetchRuntimeConfig();
    const afkSeconds = runtimeConfig?.afkSeconds ?? 0;
    if (afkSeconds > 0) {
        config.setFlagEnabled(Flags.AFKDetection, true);
        config.setNumericSetting(NumericParameters.AFKTimeoutSecs, afkSeconds);
        config.setNumericSetting(NumericParameters.AFKCountdownSecs, 10);
    } else {
        config.setFlagEnabled(Flags.AFKDetection, false);
    }

	// Create the main Pixel Streaming object for interfacing with the web-API of Pixel Streaming
	const stream = new PixelStreaming(config);

	const application = new Application({
		stream,
		onColorModeChanged: (isLightMode) => PixelStreamingApplicationStyles.setColorMode(isLightMode)
	});
	document.body.appendChild(application.rootElement);

	window.pixelStreaming = stream;
}
