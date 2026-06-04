import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type CallState = {
  active: boolean;
  incoming: boolean;
  callId: string | null;
  conversationId: string | null;
  incomingVideo: boolean;
  sdpOffer: RTCSessionDescriptionInit | null;
};

const initialState: CallState = {
  active: false,
  incoming: false,
  callId: null,
  conversationId: null,
  incomingVideo: true,
  sdpOffer: null,
};

const callSlice = createSlice({
  name: "call",
  initialState,
  reducers: {
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
    },
  },
});

export const { setIncomingCall, setCallActive, clearCall } = callSlice.actions;
export default callSlice.reducer;
