import { Message } from "@/types";

// Utility function to format a date string into a user-friendly representation
export const formatTime = (date: string | Date) => {
    if (!date) return "";

    const targetDate = new Date(date);
    const now = new Date();

    // Strictly compare calendar day differences
    const targetDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Calculate calendar day difference
    const diffTime = today.getTime() - targetDay.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // For Today -> Show time only (e.g., "10:15 PM")
    if (diffDays === 0) {
        return targetDate.toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit' });
    }

    // For Yesterday -> "Yesterday"
    if (diffDays === 1) {
        return "Yesterday";
    }

    // For Past Week (less than 7 days ago) -> Show Day Name (e.g., "Tuesday")
    if (diffDays < 7) {
        return targetDate.toLocaleDateString([], { weekday: 'long' });
    }

    // For Older than a week -> Show Month/Day/Year (e.g., "24/10/2026" or "10/24/26" based on user locale)
    return targetDate.toLocaleDateString([], { day: 'numeric', month: 'numeric', year: 'numeric' });
};

// Utility function to group messages by date for display in chat UI
export const groupMessagesByDate = (messages: Message[]): Record<string, Message[]> => {
    const groups: Record<string, Message[]> = {};

    // Sort messages chronologically (oldest first) to ensure correct order within groups
    const sortedMessages = [...messages].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    sortedMessages.forEach((msg) => {
        if (!msg.createdAt) return;

        const targetDate = new Date(msg.createdAt);
        const now = new Date();

        // Normalize dates to midnight for strict calendar day comparison
        const targetDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const diffTime = today.getTime() - targetDay.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let header = "";

        // Determine WhatsApp-style Chat Header
        if (diffDays === 0) {
            header = "Today";
        } else if (diffDays === 1) {
            header = "Yesterday";
        } else if (diffDays < 7) {
            // e.g., "Wednesday"
            header = targetDate.toLocaleDateString([], { weekday: "long" });
        } else {
            // e.g., "September 24, 2026" or "24 October 2026" depending on user locale
            header = targetDate.toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" });
        }

        // Initialize group array if it doesn't exist yet
        if (!groups[header]) {
            groups[header] = [];
        }

        groups[header].push(msg);
    });

    return groups;
};

