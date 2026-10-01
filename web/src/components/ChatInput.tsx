import { Paperclip, Send, Smile } from "lucide-react";
import { useRef } from "react";

interface ChatInputProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onSubmit: (e: SubmitEvent | React.SyntheticEvent) => void;
    disabled?: boolean;
}

export function ChatInput({ value, onChange, onSubmit, disabled = false }: ChatInputProps) {

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.nativeEvent.isComposing) return;
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!disabled) onSubmit(e);
        }
    };

    const isSendDisabled = disabled || !value.trim();

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleResize = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
        const textarea = e.currentTarget;
        const container = textarea.parentElement;
        
        // reset and calculate height
        textarea.style.height = 'auto';
        const newHeight = Math.min(textarea.scrollHeight, 120);
        textarea.style.height = `${newHeight}px`;

        // scale down the border radius as height increases
        if (container) {
            const minHeight = 40; // base height
            const maxHeight = 120;
            const minRadius = 12;
            const maxRadius = 24;

            // linear interpolation calculation
            const progress = (newHeight - minHeight) / (maxHeight - minHeight);
            const dynamicRadius = maxRadius - progress * (maxRadius - minRadius);

            container.style.borderRadius = `${dynamicRadius}px`;
        }
    };

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (!isSendDisabled) onSubmit(e);
            }}
            className="p-2 bg-black/5 flex items-center gap-2 w-full"
        >
            {/* Input Bar Container */}
            <div
                className="flex flex-1 items-center bg-base-300/60 px-3 py-1.5 gap-2 border border-base-300/30 transition-[border-radius] duration-200 ease-out"
                style={{ borderRadius: '24px' }}
            >
                <button
                    type="button"
                    aria-label="Add emoji"
                    className="btn btn-ghost btn-circle btn-xs text-base-content/50"
                >
                    <Smile className="size-5" />
                </button>

                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={onChange}
                    onInput={handleResize}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder="Type a message"
                    className="w-full h-6 max-h-[120px] resize-none py-2 px-1 border-none bg-transparent text-base-content text-sm placeholder:text-base-content/50 focus:ring-0 focus:outline-none rounded-xl overflow-y-auto align-middle"
                    style={{ height: '40px' }}
                />

                <button
                    type="button"
                    aria-label="Attach file"
                    className="btn btn-ghost btn-circle btn-xs text-base-content/50"
                >
                    <Paperclip className="size-5" />
                </button>
            </div>

            {/* Send Button */}
            <button
                type="submit"
                aria-label="Send message"
                disabled={isSendDisabled}
                className="btn btn-circle bg-[#F4A261] text-[#0D0D0F] hover:bg-[#F4A261]/90 border-none min-h-[2.5rem] h-10 w-10 p-0 flex items-center justify-center disabled:bg-base-300 disabled:text-base-content/30"
            >
                <Send className="size-4" />
            </button>
        </form>
    )
}
