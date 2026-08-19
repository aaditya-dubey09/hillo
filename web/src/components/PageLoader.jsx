import { LoaderIcon } from "lucide-react"

function PageLoader() {
    return (
        <div role="status" className="flex items-center justify-center h-screen bg-black">
            <LoaderIcon className="size-12 animate-spin text-orange-500" />
            <span className="sr-only">Loading authentication</span>
        </div>
    )
}

export default PageLoader