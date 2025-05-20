import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, CircleNotch, Trash } from "@phosphor-icons/react";
import Workspace from "@/models/workspace";
import paths from "@/utils/paths";
import showToast from "@/utils/toast";
import ThreadItem from './ThreadItem.js';
export const THREAD_RENAME_EVENT = "renameThread";
const STYLES = {
    loadingContainer: "flex flex-col bg-pulse w-full h-10 items-center justify-center",
    loadingText: "text-xs text-white animate-pulse",
    container: "flex flex-col",
    newThreadButton: "w-full relative flex h-[40px] items-center border-none hover:bg-[var(--theme-sidebar-thread-selected)] hover:light:bg-theme-sidebar-subitem-hover rounded-lg",
    buttonContent: "flex w-full gap-x-2 items-center pl-4",
    iconContainer: "bg-white/20 p-2 rounded-lg h-[24px] w-[24px] flex items-center justify-center",
    icon: "shrink-0 text-white light:text-theme-text-primary",
    buttonText: "text-left text-white light:text-theme-text-primary text-sm",
    deleteButton: "w-full relative flex h-[40px] items-center border-none hover:bg-red-400/20 rounded-lg group",
    deleteIcon: "shrink-0 text-white light:text-red-500/50 group-hover:text-red-400",
    deleteText: "text-white light:text-theme-text-secondary text-left text-sm group-hover:text-red-400",
};
export default function ThreadContainer({ workspace }) {
    const { threadSlug = null } = useParams();
    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ctrlPressed, setCtrlPressed] = useState(false);
    useEffect(() => {
        const chatHandler = (event) => {
            const { threadSlug, newName } = event.detail;
            setThreads((prevThreads) => prevThreads.map((thread) => {
                if (thread.slug === threadSlug) {
                    return Object.assign(Object.assign({}, thread), { name: newName });
                }
                return thread;
            }));
        };
        window.addEventListener(THREAD_RENAME_EVENT, chatHandler);
        return () => {
            window.removeEventListener(THREAD_RENAME_EVENT, chatHandler);
        };
    }, []);
    useEffect(() => {
        async function fetchThreads() {
            if (!workspace.slug)
                return;
            const { threads } = await Workspace.threads.all(workspace.slug);
            setLoading(false);
            setThreads(threads);
        }
        fetchThreads();
    }, [workspace.slug]);
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (["Control", "Meta"].includes(event.key)) {
                setCtrlPressed(true);
            }
        };
        const handleKeyUp = (event) => {
            if (["Control", "Meta"].includes(event.key)) {
                setCtrlPressed(false);
                setThreads((prev) => prev.map((t) => {
                    return Object.assign(Object.assign({}, t), { deleted: false });
                }));
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);
    const toggleForDeletion = (id) => {
        setThreads((prev) => prev.map((t) => {
            if (t.id !== id)
                return t;
            return Object.assign(Object.assign({}, t), { deleted: !t.deleted });
        }));
    };
    const handleDeleteAll = async () => {
        const slugs = threads.filter((t) => t.deleted === true).map((t) => t.slug);
        await Workspace.threads.deleteBulk(workspace.slug, slugs);
        setThreads((prev) => prev.filter((t) => !t.deleted));
    };
    function removeThread(threadId) {
        setThreads((prev) => prev.map((_t) => {
            if (_t.id !== threadId)
                return _t;
            return Object.assign(Object.assign({}, _t), { deleted: true });
        }));
        setTimeout(() => {
            setThreads((prev) => prev.filter((t) => !t.deleted));
        }, 500);
    }
    if (loading) {
        return (<div className={STYLES.loadingContainer}>
        <p className={STYLES.loadingText}>loading threads....</p>
      </div>);
    }
    const activeThreadIdx = !!threads.find((thread) => (thread === null || thread === void 0 ? void 0 : thread.slug) === threadSlug)
        ? threads.findIndex((thread) => (thread === null || thread === void 0 ? void 0 : thread.slug) === threadSlug) + 1
        : 0;
    return (<div className={STYLES.container} role="list" aria-label="Threads">
      <ThreadItem idx={0} activeIdx={activeThreadIdx} isActive={activeThreadIdx === 0} thread={{ slug: null, name: "default", id: "default" }} workspace={workspace} onRemove={() => { }} toggleMarkForDeletion={() => { }} hasNext={threads.length > 0}/>
      {threads.map((thread, i) => (<ThreadItem key={thread.slug} idx={i + 1} ctrlPressed={ctrlPressed} toggleMarkForDeletion={toggleForDeletion} activeIdx={activeThreadIdx} isActive={activeThreadIdx === i + 1} workspace={workspace} onRemove={removeThread} thread={thread} hasNext={i !== threads.length - 1}/>))}
      <DeleteAllThreadButton ctrlPressed={ctrlPressed} threads={threads} onDelete={handleDeleteAll}/>
      <NewThreadButton workspace={workspace}/>
    </div>);
}
function NewThreadButton({ workspace }) {
    const [loading, setLoading] = useState(false);
    const onClick = async () => {
        setLoading(true);
        const { thread, error } = await Workspace.threads.new(workspace.slug);
        if (!!error) {
            showToast(`Could not create thread - ${error}`, "error", { clear: true });
            setLoading(false);
            return;
        }
        window.location.replace(paths.workspace.thread(workspace.slug, thread.slug));
    };
    return (<button onClick={onClick} className={STYLES.newThreadButton}>
      <div className={STYLES.buttonContent}>
        <div className={STYLES.iconContainer}>
          {loading ? (<CircleNotch weight="bold" size={14} className={`${STYLES.icon} animate-spin`}/>) : (<Plus weight="bold" size={14} className={STYLES.icon}/>)}
        </div>

        <p className={STYLES.buttonText}>
          {loading ? "Starting Thread..." : "New Thread"}
        </p>
      </div>
    </button>);
}
function DeleteAllThreadButton({ ctrlPressed, threads, onDelete }) {
    if (!ctrlPressed || threads.filter((t) => t.deleted).length === 0)
        return null;
    return (<button type="button" onClick={onDelete} className={STYLES.deleteButton}>
      <div className={STYLES.buttonContent}>
        <div className="bg-transparent p-2 rounded-lg h-[24px] w-[24px] flex items-center justify-center">
          <Trash weight="bold" size={14} className={STYLES.deleteIcon}/>
        </div>
        <p className={STYLES.deleteText}>
          Delete Selected
        </p>
      </div>
    </button>);
}
//# sourceMappingURL=index.js.map