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
		// claude-fix:voice-protocol-speak-extraction — STRICT extraction of `> 🔊 ...` blockquote content.
		//
		// operator-daemon's transform_operator_tags converts <speak>X</speak> into
		//   \n> 🔊 X\n        (single-line speak)
		//   \n> 🔊 L1\n> L2\n  (multi-line — every continuation gets `> ` prefix)
		// so we need a tiny state machine, not just a per-line regex: once we see
		// `> 🔊`, fold contiguous `> ...` lines into the same voice block until a
		// non-blockquote line ends it.
		//
		// STRICT means no fallback to full text when zero `> 🔊` lines are
		// found — voiceContent stays ''. Empty string defeats the `?? displayText`
		// fallback at call sites in Chat.svelte/ResponseMessage.svelte so the
		// model stays in charge of when voice plays. Previously the fallback was
		// leaking pre-protocol streaming chunks into TTS (the model writes some
		// prose first, THEN the `<speak>` block — the prose got spoken before the
		// speak marker even arrived in the stream).
		const voiceChunks: string[] = [];
		let inSpeak = false;
		for (const line of content.split('\n')) {
			const opener = line.match(/^>\s*🔊\s+(.*)$/);
			if (opener) {
				inSpeak = true;
				voiceChunks.push(opener[1].trim());
				continue;
			}
			if (inSpeak) {
				const cont = line.match(/^>\s*(.*)$/);
				if (cont) {
					voiceChunks.push(cont[1].trim());
				} else {
					inSpeak = false;
				}
			}
		}
		const voiceContent = voiceChunks.filter(Boolean).join(' ');
		return {
			requestedChannel: normalizedChannel,
			hasStructuredContent: false,
			rawDisplayText: text,
			rawVoiceText: voiceContent,
			displayText: normalizedChannel === 'voice' ? null : text,
			voiceText: normalizedChannel === 'display' ? null : voiceContent
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
