import { Inject, Injectable } from "../../container";
import { B } from "./dependency-b";

@Injectable()
export class A {
    @Inject(B)
    b!: B;
}