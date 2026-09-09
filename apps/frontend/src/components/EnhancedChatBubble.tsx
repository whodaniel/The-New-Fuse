// @ts-nocheck
import message_utils_1 from '../../utils/message-utils';
import ui_1 from '../ui';

export function EnhancedChatBubble({ message, agents, workspace, onActionClick }) {
  const isUser = message.sender?.type === 'user';
  const agent = message.metadata?.agentId
    ? agents?.find((a) => a.id === message.metadata.agentId)
    : null;

  // Check for AG-UI Dynamic UI block in message content
  let dynamicUiSchema = null;
  if (
    message.content &&
    (message.content.includes('```ag-ui') ||
      message.content.includes('"layout":') ||
      message.metadata?.agUiSchema)
  ) {
    try {
      if (message.metadata?.agUiSchema) {
        dynamicUiSchema = message.metadata.agUiSchema;
      } else {
        const match = message.content.match(/```ag-ui\s*([\s\S]*?)\s*```/);
        if (match) {
          dynamicUiSchema = JSON.parse(match[1]);
        }
      }
    } catch {
      dynamicUiSchema = null;
    }
  }

  return (
    <div className="flex justify-center items-end w-full bg-theme-bg-secondary my-1">
      <div
        className={`py-2 px-4 w-full flex gap-x-5 md:max-w-[85%] flex-col ${isUser ? 'items-end' : 'items-start'}`}
      >
        <div className={`flex gap-x-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} w-full`}>
          <ui_1.UserIcon user={message.sender} role={message.sender?.type} />
          <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[90%]`}>
            <div
              className={`rounded-lg p-3 ${
                isUser
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-800 text-neutral-100 border border-neutral-700'
              }`}
            >
              <span className="whitespace-pre-line font-normal text-sm leading-relaxed">
                {message.content?.replace(/```ag-ui[\s\S]*?```/g, '').trim()}
              </span>

              {/* In-Stream AG-UI Dynamic Interactive Micro-Surface */}
              {dynamicUiSchema && (
                <div className="mt-3 p-3 bg-slate-900/90 rounded-md border border-cyan-500/30 text-xs">
                  <div className="flex items-center justify-between font-semibold text-cyan-400 mb-2">
                    <span>
                      ⚡ AG-UI Live Surface: {dynamicUiSchema.title || 'Dynamic Action Panel'}
                    </span>
                    <span className="text-[10px] bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                      Interactive
                    </span>
                  </div>
                  {dynamicUiSchema.description && (
                    <p className="text-slate-400 text-[11px] mb-3">{dynamicUiSchema.description}</p>
                  )}
                  <div className="flex flex-col gap-2">
                    {dynamicUiSchema.elements?.map((el, i) => (
                      <div
                        key={el.id || i}
                        className="flex justify-between items-center bg-slate-800/80 p-2 rounded border border-slate-700"
                      >
                        <span className="text-slate-300 font-medium">{el.label || el.id}</span>
                        {el.type === 'button' && (
                          <button
                            onClick={() => onActionClick?.(el)}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs font-semibold"
                          >
                            {el.label || 'Execute'}
                          </button>
                        )}
                        {el.type === 'metric' && (
                          <span className="text-cyan-300 font-bold">{el.value}</span>
                        )}
                        {el.type === 'toggle' && (
                          <input
                            type="checkbox"
                            defaultChecked={el.value}
                            className="accent-blue-500"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 px-1">
              <span className="text-[11px] text-muted-foreground">
                {(0, message_utils_1.formatTimestamp)(message.timestamp)}
              </span>
              {agent && (
                <span className="text-[11px] text-muted-foreground font-medium">
                  via {agent.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default EnhancedChatBubble;
