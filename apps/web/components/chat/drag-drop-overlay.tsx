import { Upload } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface DragDropOverlayProps {
  isVisible: boolean;
  isDragOver: boolean;
}

export const DragDropOverlay = ({
  isVisible,
  isDragOver,
}: DragDropOverlayProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
        >
          <div
            className={`flex h-full w-full items-center justify-center border-4 border-dashed transition-colors duration-200 ${
              isDragOver
                ? "border-primary bg-primary/5 dark:border-primary/80 dark:bg-primary/10"
                : "border-muted-foreground/30 bg-background/80 dark:border-muted-foreground/20 dark:bg-background/90"
            }
            `}
          >
            <div className="flex flex-col items-center gap-4 rounded-lg bg-background/95 p-8 shadow-lg backdrop-blur-sm dark:bg-background/95">
              <Upload
                className={`size-12 transition-colors duration-200 ${isDragOver ? "text-primary" : "text-muted-foreground"}
                `}
              />
              <div className="text-center">
                <p
                  className={`font-medium text-lg transition-colors duration-200 ${isDragOver ? "text-primary" : "text-foreground"}
                `}
                >
                  {isDragOver
                    ? "Drop files here"
                    : "Drag files anywhere to upload"}
                </p>
                <p className="text-muted-foreground text-sm">
                  Files will be attached to your message
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
