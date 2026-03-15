export const VOICE_RESPONSE_CHANNELS = ['both', 'display', 'voice'] as const;

export type VoiceResponseChannel = (typeof VOICE_RESPONSE_CHANNELS)[number];

export type VoiceProtocolContent =
	| string
	| {
			display?: unknown;
			voice?: unknown;
	  }
	| null
	| undefined;

export type VoiceProtocolPlan = {
	requestedChannel: VoiceResponseChannel;
	hasStructuredContent: boolean;
	rawDisplayText: string | null;
	rawVoiceText: string | null;
	displayText: string | null;
	voiceText: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const toOptionalText = (value: unknown): string | null =>
	typeof value === 'string' && value.trim().length > 0 ? value : null;

export const normalizeVoiceResponseChannel = (value: unknown): VoiceResponseChannel =>
	VOICE_RESPONSE_CHANNELS.includes(value as VoiceResponseChannel)
		? (value as VoiceResponseChannel)
		: 'both';

export const planVoiceProtocolContent = (
	content: VoiceProtocolContent,
	requestedChannel: unknown = 'both'
): VoiceProtocolPlan => {
	const normalizedChannel = normalizeVoiceResponseChannel(requestedChannel);

	if (typeof content === 'string') {
		const text = toOptionalText(content);
		return {
			requestedChannel: normalizedChannel,
			hasStructuredContent: false,
			rawDisplayText: text,
			rawVoiceText: text,
			displayText: normalizedChannel === 'voice' ? null : text,
			voiceText: normalizedChannel === 'display' ? null : text
		};
	}

	if (isRecord(content)) {
		const rawDisplayText = toOptionalText(content.display);
		const rawVoiceText = toOptionalText(content.voice);

		return {
			requestedChannel: normalizedChannel,
			hasStructuredContent: true,
			rawDisplayText,
			rawVoiceText,
			displayText: normalizedChannel === 'voice' ? null : rawDisplayText,
			voiceText: normalizedChannel === 'display' ? null : rawVoiceText
		};
	}

	return {
		requestedChannel: normalizedChannel,
		hasStructuredContent: false,
		rawDisplayText: null,
		rawVoiceText: null,
		displayText: null,
		voiceText: null
	};
};

export const getCopyableVoiceProtocolText = (
	content: VoiceProtocolContent,
	requestedChannel: unknown = 'both'
) => {
	const plan = planVoiceProtocolContent(content, requestedChannel);
	return plan.displayText ?? plan.voiceText ?? '';
};
