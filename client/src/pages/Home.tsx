import { Button } from "@/components/ui/button"

const Home = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-svh">
        <Button onClick={() => console.log("Button clicked!")}>
            Click me
        </Button>
      </div> 
    )
}

export default Home;