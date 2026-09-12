import { SendIcon } from "lucide-react";

export function ChatInput({ value, onChange, onSubmit, disabled }: {
    value: string,
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void,
    onSubmit: (e: SubmitEvent | React.SyntheticEvent
    ) => void,
    disabled: boolean
}) {

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.nativeEvent.isComposing) return;
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!disabled) onSubmit(e);
        }
    };

    return (
        <form onSubmit={(e) => {e.preventDefault(); onSubmit(e);}} className="p-2 bg-linear-to-t from-black/30">
            <div className="flex items-center gap-3">
                <textarea
                    value={value}
                    onChange={onChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    className="textarea w-full resize-none min-h-[2.5rem] max-h-40 rounded-xl bg-base-300/40 border-none outline-none placeholder:text-base-content/60"
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
