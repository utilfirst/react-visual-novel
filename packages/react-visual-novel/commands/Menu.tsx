import type { ImageViewProps, MenuViewProps } from "#commands/views/index.ts";
import { ImageView, MenuView } from "#commands/views/index.ts";
import type { CommandProps } from "#components/index.ts";
import { Command } from "#components/index.ts";

export type MenuProps = Pick<
  CommandProps,
  "audio" | "hide" | "next" | "zIndex"
> &
  Omit<MenuViewProps, "controls"> & {
    image?: string | Omit<ImageViewProps, "controls">;
  };

export function Menu(props: MenuProps) {
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
          {imageProps && <ImageView controls={controls} {...imageProps} />}
          <MenuView controls={controls} {...menuProps} />
        </>
      )}
    </Command>
  );
}
