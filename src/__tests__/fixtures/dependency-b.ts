import { Inject, Injectable } from "../../container";
import { A } from "./dependency-a";

@Injectable()
export class B {
    @Inject(A)
    a!: A;
}