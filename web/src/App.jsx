import './App.css'
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react'

function App() {

  return (
    <>
      <section>
        <h1>Welcome to Hillo!</h1>

        <Show when="signed-out">
          <SignInButton oauthFlow='redirect' />
          <SignUpButton oauthFlow='redirect' />
        </Show>

        <Show when="signed-in">
          <UserButton />
        </Show>
      </section>
    </>
  )
}

export default App
