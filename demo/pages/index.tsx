import dynamic from "next/dynamic";

const MyGame = dynamic(() => import("#game/MyGame.tsx"), { ssr: false });

export default function Play() {
  return <MyGame />;
}
