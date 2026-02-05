package org.example;

public class Main {
    public static void main(String[] args) {

        Node A = new Node("A");
        Node B = new Node("B");
        Node C = new Node("C");
        Node D = new Node("D");
        Node E = new Node("E");
        Node F = new Node("F");
        Node G = new Node("G");

        A.addChild(B);

        B.addChild(C);
        B.addChild(D);
        B.addChild(E);

        C.addChild(F);
        C.addChild(G);

        System.out.println("Tree created.");
    }
}
