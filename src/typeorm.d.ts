declare module 'typeorm' {
  export function Entity(name?: string): ClassDecorator;
  export function PrimaryGeneratedColumn(type?: string): PropertyDecorator;
  export function Column(options?: any): PropertyDecorator;
  export function CreateDateColumn(options?: any): PropertyDecorator;
  export function UpdateDateColumn(options?: any): PropertyDecorator;
  export function ManyToOne(type: () => any, inverseSide?: any): PropertyDecorator;
  export function OneToMany(type: () => any, inverseSide?: any): PropertyDecorator;
  export function JoinColumn(options?: any): PropertyDecorator;
}
