import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bottom-0 border-t inset-2x-0 border-zinc-500/10">
          <div className="flex flex-col gap-1 px-6 py-12 mx-auto text-xs text-center text-zinc-700 max-w-7xl lg:px-8">
            <p>
              Built by{" "}
              <Link href="https://github.com/tb-rules10" className="font-semibold duration-150 hover:text-zinc-200">
                Tanishq Bhatt
              </Link>
            </p>
            {/* <p>
              EnvShare is deployed on{" "}
              <Link target="_blank" href="https://vercel.com" className="underline duration-150 hover:text-zinc-200">
                Vercel
              </Link>{" "}
              and uses{" "}
              <Link target="_blank" href="https://upstash.com" className="underline duration-150 hover:text-zinc-200">
                Upstash
              </Link>{" "}
              for storing encrypted data.
            </p> */}
          </div>
        </footer>
  )
}

export default Footer
