import {Router} from "express";

const authRouter = Router();

authRouter.post("/sign-up", (req, res) => {
    res.send({title: "Cadastrar"});
})

authRouter.post("/sign-in", (req, res) => {
    res.send({title: "Entrar"});
})

authRouter.post("/sign-out", (req, res) => {
    res.send({title: "Sair"});
})

export default authRouter;