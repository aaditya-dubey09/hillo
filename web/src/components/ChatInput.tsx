import { Send, SendIcon } from "lucide-react";

export function ChatInput({ value, onChange, onSubmit, disabled }: {
    value: string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onSubmit: (e: SubmitEvent | React.SyntheticEvent
    ) => void,
    disabled: boolean
}) {

    return (
        // todo: it submits on pressing enter/shift+enter fix this
        // todo: also increase the height of input box when text is more than 1 line instead of hiding overflow
        <form onSubmit={onSubmit} className="p-2 bg-linear-to-t from-black/30">
            <div className="flex items-center gap-3">
                <input
                    type="text"
                    value={value}
                    onChange={onChange}
                    placeholder="Type a message..."
                    className="input flex-1 rounded-xl bg-base-300/40 border-none outline-none placeholder:text-base-content/60"
                />
                <button
                    type="submit"
                    disabled={disabled}
                    className="btn rounded-full bg-linear-to-r from-amber-500 to-orange-500 border-none disabled:btn-disabled"
                >
                    <SendIcon className="size-5" />
                </button>
            </div>
        </form>
    )
}
