'use client';

import { motion, useReducedMotion } from 'motion/react';
import { MousePointerClick, ShieldCheck, Truck } from 'lucide-react';

const PERKS = [
  { icon: Truck, title: 'Envíos a todo el país', text: 'Recibe tu pedido donde estés.' },
  { icon: ShieldCheck, title: 'Pago seguro con PayPal', text: 'Entorno de prueba, sin dinero real.' },
  { icon: MousePointerClick, title: 'Compra en pocos pasos', text: 'Carrito, checkout y listo.' },
];

export function PerksStrip() {
  const reduce = useReducedMotion();

  return (
    <motion.section
      aria-label="Ventajas"
      className="mt-5 grid gap-3 sm:grid-cols-3"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.06 } } }}
    >
      {PERKS.map(({ icon: Icon, title, text }) => (
        <motion.div
          key={title}
          variants={{
            hidden: { opacity: 0, y: reduce ? 0 : 12 },
            show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.35, ease: [0.2, 0.7, 0.2, 1] } },
          }}
          whileHover={reduce ? undefined : { y: -2, transition: { duration: 0.2 } }}
          className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm transition-colors duration-200 hover:border-accent"
        >
          <span aria-hidden="true" className="flex h-11 w-11 flex-none items-center justify-center rounded-md bg-accent/10 text-accent">
            <Icon className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-display text-base font-medium">{title}</span>
            <span className="mt-0.5 block text-sm text-muted-foreground">{text}</span>
          </span>
        </motion.div>
      ))}
    </motion.section>
  );
}
