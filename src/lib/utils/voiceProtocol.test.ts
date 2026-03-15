import { describe, expect, it } from 'vitest';

import {
	getCopyableVoiceProtocolText,
	normalizeVoiceResponseChannel,
	planVoiceProtocolContent
} from './voiceProtocol';

describe('voiceProtocol', () => {
	it('treats legacy strings as both channels by default', () => {
		expect(planVoiceProtocolContent('Hello')).toEqual({
			requestedChannel: 'both',
			hasStructuredContent: false,
			rawDisplayText: 'Hello',
			rawVoiceText: 'Hello',
			displayText: 'Hello',
			voiceText: 'Hello'
		});
	});

	it('routes structured content without breaking legacy fallback', () => {
		expect(planVoiceProtocolContent({ display: 'Shown', voice: 'Spoken' }, 'display')).toEqual({
			requestedChannel: 'display',
			hasStructuredContent: true,
			rawDisplayText: 'Shown',
			rawVoiceText: 'Spoken',
			displayText: 'Shown',
			voiceText: null
		});

		expect(planVoiceProtocolContent({ display: 'Shown', voice: 'Spoken' }, 'voice')).toEqual({
			requestedChannel: 'voice',
			hasStructuredContent: true,
			rawDisplayText: 'Shown',
			rawVoiceText: 'Spoken',
			displayText: null,
			voiceText: 'Spoken'
		});
	});

	it('falls back to both for invalid channel values', () => {
		expect(normalizeVoiceResponseChannel('invalid')).toBe('both');
		expect(getCopyableVoiceProtocolText('Hello', 'invalid')).toBe('Hello');
	});

	it('ignores empty structured channel strings', () => {
		expect(planVoiceProtocolContent({ display: '   ', voice: ' Alert ' })).toEqual({
			requestedChannel: 'both',
			hasStructuredContent: true,
			rawDisplayText: null,
			rawVoiceText: ' Alert ',
			displayText: null,
			voiceText: ' Alert '
		});
	});
});
