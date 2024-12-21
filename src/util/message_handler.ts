import type { ChangeJson } from './change';
import { state } from './state';
import { Trail, type TrailJson } from './trail';

type Message = {
    type: string;
};
type TrailDataMessage = Message & {
    type: 'trailData';
    sections: string[];
    states: string[];
    trails: TrailJson[];
};

type ApplyChangeMessage = Message & {
    type: 'applyChange';
    change: ChangeJson;
};

type MessageHandler = (
    message: any,
    sender: chrome.runtime.MessageSender | null,
    sendResponse: ((response?: any) => void) | null
) => boolean;

function isValidMessage(message: any): message is Message {
    return message !== null && message !== undefined && 'type' in message;
}

function handleTrailDataMessage(message: TrailDataMessage) {
    state.sections = message.sections;
    state.states = message.states;
    state.trails = message.trails
        .map(Trail.fromJsonObject)
        .sort((a: Trail, b: Trail) => a.compareTo(b));
}

// Event listener
function handleMessages<T>(
    message: any,
    sender: chrome.runtime.MessageSender | null = null,
    sendResponse: ((response?: any) => void) | null = null
) {
    if (!isValidMessage(message)) {
        return false;
    }
    if (message.type === 'trailData') {
        const trailDataMessage = message as TrailDataMessage;
        state.sections = trailDataMessage.sections;
        state.states = trailDataMessage.states;
        state.trails = trailDataMessage.trails
            .map(Trail.fromJsonObject)
            .sort((a: Trail, b: Trail) => a.compareTo(b));
        return false;
    }

    return false;
}

export { handleTrailDataMessage, isValidMessage };
export type { MessageHandler, TrailDataMessage, Message, ApplyChangeMessage };
