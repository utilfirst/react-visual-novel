import type { ImageViewProps } from "#commands/views/ImageView.tsx";
import { ImageView } from "#commands/views/ImageView.tsx";
import type { MenuViewProps } from "#commands/views/MenuView.tsx";
import { MenuView } from "#commands/views/MenuView.tsx";
import type { CommandProps } from "#components/Command.tsx";
import { Command } from "#components/Command.tsx";
import type { BranchId } from "#types.ts";

export type MenuProps<TBranchId extends string = BranchId> = Pick<
  CommandProps,
  "audio" | "hide" | "next" | "zIndex"
> &
  Omit<MenuViewProps<TBranchId>, "controls"> & {
    image?: string | Omit<ImageViewProps, "controls">;
  };

export function Menu<TBranchId extends string = BranchId>(
  props: MenuProps<TBranchId>,
) {
  const { image, audio, hide, next, zIndex, ...menuProps } = props;
  const imageProps = typeof image === "string" ? { uri: image } : image;

  return (
    <Command
      name="Menu"
      behavior={["non_skippable"]}
      audio={audio}
      hide={hide}
      next={next}
      zIndex={zIndex}
    >
      {(controls) => (
        <>
          {imageProps !== undefined && (
            <ImageView controls={controls} {...imageProps} />
          )}

          <MenuView controls={controls} {...menuProps} />
        </>
      )}
    </Command>
  );
}
