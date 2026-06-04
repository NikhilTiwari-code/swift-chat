import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type CallState = {
  active: boolean;
  incoming: boolean;
  callId: string | null;
  conversationId: string | null;
  incomingVideo: boolean;
  sdpOffer: RTCSessionDescriptionInit | null;
  outbound: { video: boolean; conversationId: string } | null;
};

const initialState: CallState = {
  active: false,
  incoming: false,
  callId: null,
  conversationId: null,
  incomingVideo: true,
  sdpOffer: null,
  outbound: null,
};

const callSlice = createSlice({
  name: "call",
  initialState,
  reducers: {
    initiateCall(state, action: PayloadAction<{ conversationId: string; video: boolean }>) {
      state.outbound = {
        video: action.payload.video,
        conversationId: action.payload.conversationId,
      };
    },
    clearOutbound(state) {
      state.outbound = null;
    },
    setIncomingCall(
      state,
      action: PayloadAction<{
        callId: string;
        conversationId: string;
        incomingVideo: boolean;
        sdpOffer: RTCSessionDescriptionInit;
      }>
    ) {
      state.incoming = true;
      state.callId = action.payload.callId;
      state.conversationId = action.payload.conversationId;
      state.incomingVideo = action.payload.incomingVideo;
      state.sdpOffer = action.payload.sdpOffer;
    },
    setCallActive(state, action: PayloadAction<{ callId: string; conversationId: string }>) {
      state.active = true;
      state.incoming = false;
      state.callId = action.payload.callId;
      state.conversationId = action.payload.conversationId;
    },
    clearCall(state) {
      state.active = false;
      state.incoming = false;
      state.callId = null;
      state.conversationId = null;
      state.incomingVideo = true;
      state.sdpOffer = null;
      state.outbound = null;
    },
  },
});

export const { initiateCall, clearOutbound, setIncomingCall, setCallActive, clearCall } = callSlice.actions;
export default callSlice.reducer;
