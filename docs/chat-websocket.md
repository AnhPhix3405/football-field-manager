# Chat WebSocket contract

## Connection

- Transport: Socket.IO
- HTTP server: same host and port as the NestJS API
- Namespace: `/chat`
- Authentication: JWT access token in `auth.token` or the
  `Authorization: Bearer <token>` handshake header

```ts
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/chat', {
  auth: { token: accessToken },
  withCredentials: true,
});
```

On authentication failure, the server emits `auth:error` and disconnects the
socket.

## Starting a field-owner conversation

Create or reuse the direct conversation through REST first:

```http
POST /api/v1/conversations/fields/:fieldId
Authorization: Bearer <access-token>
```

The response contains the `conversationId` and both member IDs. The client can
then emit `conversation:join` with that ID. No separate gateway or event set is
used for field-owner chat.

## Client events

### `conversation:join`

```json
{
  "conversationId": "c8e5eb28-680a-4e66-a9e8-743f52bd27a6"
}
```

The user must be a conversation member. Existing conversations are joined
automatically during connection; this event is useful for a conversation
created while the socket is already connected.

### `message:send`

```json
{
  "conversationId": "c8e5eb28-680a-4e66-a9e8-743f52bd27a6",
  "content": "See you at the field!",
  "messageType": "text"
}
```

The message is persisted before the server emits `message:new`.

### `message:read`

```json
{
  "conversationId": "c8e5eb28-680a-4e66-a9e8-743f52bd27a6"
}
```

Marks unread messages from the other member as read.

## Server events

- `auth:error`: handshake authentication failed
- `message:new`: a persisted message was created
- `message:read`: a member read received messages
- `exception`: validation, authorization, or processing error

Socket.IO acknowledgements contain the handler result for
`conversation:join`, `message:send`, and `message:read`.
