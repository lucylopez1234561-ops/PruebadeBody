import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Search, Filter, Tag, DollarSign, Package, MessageSquare, Star, Trash2, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 gap-3 text-gray-500">
      <div className="p-4 rounded-2xl border bg-gradient-to-br from-green-50 via-blue-50 to-teal-50">
        <Package className="size-6 text-blue-500" />
      </div>
      <p className="text-lg font-semibold text-gray-700">{title}</p>
      {subtitle ? <p className="text-sm max-w-md text-gray-500">{subtitle}</p> : null}
    </div>
  );
}

type Comentario = { id: string; user: string; text: string; rating: number; date: number };

type Producto = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  imagenUrl: string;
  valoraciones: number[];
  comentarios: Comentario[];
};

type CartItem = { productId: string; cantidad: number };

const MIN_PROVEEDOR = 3;

function calcularPrecioPure(precio: number, cantidad: number, modoProveedor: boolean) {
  if (modoProveedor || cantidad >= MIN_PROVEEDOR) return +(precio * 0.75).toFixed(2);
  return +precio.toFixed(2);
}

function applyCouponPure(total: number, percent?: number) {
  if (!percent || percent <= 0) return +total.toFixed(2);
  return +(total * (1 - percent / 100)).toFixed(2);
}

function nextDecQty(current: number) {
  const min = current >= MIN_PROVEEDOR ? MIN_PROVEEDOR : 1;
  const next = current - 1;
  return next < min ? min : next;
}

function promedioProducto(valoraciones: number[], comentarios: Comentario[]) {
  const extra = comentarios.map((c) => c.rating);
  const all = [...valoraciones, ...extra];
  if (all.length === 0) return 0;
  return all.reduce((a, b) => a + b, 0) / all.length;
}

export default function TiendaDigitalCedeno() {
  const [productos, setProductos] = useState<Producto[]>([
    { id: "1", nombre: "ChatGPT Premium", descripcion: "La Mejor IA Del Mercado", precio: 3.75, categoria: "tecnologia", imagenUrl: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg", valoraciones: [5, 4, 5], comentarios: [] },
    { id: "2", nombre: "ChatGPT Asistente", descripcion: "La Mejor IA Del Mercado", precio: 3.75, categoria: "tecnologia", imagenUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/ChatGPT-Logo.svg/1024px-ChatGPT-Logo.svg.png", valoraciones: [4, 3], comentarios: [] },
    { id: "3", nombre: "ChatGPT Pro", descripcion: "La Mejor IA Del Mercado", precio: 3.75, categoria: "tecnologia", imagenUrl: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg", valoraciones: [5, 5, 4], comentarios: [] }
  ]);

  const [carrito, setCarrito] = useState<CartItem[]>([]);
  const [q, setQ] = useState("");
  const [categoria, setCategoria] = useState<string | undefined>(undefined);
  const [orden, setOrden] = useState<string | undefined>(undefined);
  const [mostrarProveedor, setMostrarProveedor] = useState(false);
  const [openCart, setOpenCart] = useState(false);

  const [openComentario, setOpenComentario] = useState<string | null>(null);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [nuevaValoracion, setNuevaValoracion] = useState(5);
  const [nombreUsuario, setNombreUsuario] = useState("");

  const [openLogin, setOpenLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [bannedUsers, setBannedUsers] = useState<string[]>([]);

  const [categoriesExtra, setCategoriesExtra] = useState<string[]>(["tecnologia", "hogar", "moda"]);
  const categorias = useMemo(() => Array.from(new Set([...(categoriesExtra ?? []), ...productos.map((p) => p.categoria)])), [categoriesExtra, productos]);

  const [coupons, setCoupons] = useState<{ code: string; percent: number; active: boolean }[]>([]);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percent: number } | null>(null);

  const visibles = useMemo(() => {
    let lista = [...productos];
    if (q) {
      const s = q.toLowerCase();
      lista = lista.filter((p) => [p.nombre, p.descripcion].some((v) => (v ?? "").toLowerCase().includes(s)));
    }
    if (categoria) lista = lista.filter((p) => p.categoria === categoria);
    if (orden === "precio-asc") lista.sort((a, b) => (a.precio ?? 0) - (b.precio ?? 0));
    if (orden === "precio-desc") lista.sort((a, b) => (b.precio ?? 0) - (a.precio ?? 0));
    return lista.map((p) => ({
      ...p,
      avg: promedioProducto(p.valoraciones, p.comentarios),
      count: p.valoraciones.length + p.comentarios.length,
    }));
  }, [productos, q, categoria, orden]);

  const abrirComentarios = (id: string) => setOpenComentario(id);

  const agregarComentario = (id: string) => {
    const name = nombreUsuario.trim() || "Invitado";
    if (bannedUsers.map((b) => b.toLowerCase()).includes(name.toLowerCase())) return;
    if (!nuevoComentario.trim()) return;
    const nuevo: Comentario = { id: String(Date.now()), user: name, text: nuevoComentario.trim(), rating: nuevaValoracion, date: Date.now() };
    setProductos((prev) => prev.map((p) => (p.id === id ? { ...p, comentarios: [...p.comentarios, nuevo] } : p)));
    setNuevoComentario("");
    setNuevaValoracion(5);
    setOpenComentario(null);
  };

  const eliminarComentario = (productId: string, commentId: string) => {
    setProductos((prev) => prev.map((p) => (p.id === productId ? { ...p, comentarios: p.comentarios.filter((c) => c.id !== commentId) } : p)));
  };

  const banearUsuario = (user: string) => {
    setBannedUsers((prev) => Array.from(new Set([...prev, user])));
  };

  const addToCart = (productId: string) => {
    const qtyToAdd = mostrarProveedor ? MIN_PROVEEDOR : 1;
    setCarrito((prev) => {
      const i = prev.findIndex((x) => x.productId === productId);
      if (i >= 0) {
        const copia = [...prev];
        copia[i] = { ...copia[i], cantidad: copia[i].cantidad + qtyToAdd };
        return copia;
      }
      return [...prev, { productId, cantidad: qtyToAdd }];
    });
    setOpenCart(true);
  };

  const incItem = (productId: string) => setCarrito((prev) => prev.map((it) => (it.productId === productId ? { ...it, cantidad: it.cantidad + 1 } : it)));
  const decItem = (productId: string) => setCarrito((prev) => prev.map((it) => (it.productId === productId ? { ...it, cantidad: nextDecQty(it.cantidad) } : it)));
  const removeItem = (productId: string) => setCarrito((prev) => prev.filter((it) => it.productId !== productId));
  const clearCart = () => setCarrito([]);

  const subtotal = carrito.reduce((sum, it) => {
    const p = productos.find((x) => x.id === it.productId);
    if (!p) return sum;
    const unit = calcularPrecioPure(p.precio, it.cantidad, mostrarProveedor);
    return sum + unit * it.cantidad;
  }, 0);

  const couponFound = appliedCoupon ? appliedCoupon : coupons.find((c) => c.active && c.code.toLowerCase() === couponInput.trim().toLowerCase()) || null;
  const totalConCupon = applyCouponPure(subtotal, couponFound?.percent);

  const money = (n: number) => n.toFixed(2);
  const estrellas = (val: number) => (
    <div className="flex items-center text-amber-500">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`w-4 h-4 ${i < Math.round(val) ? "fill-amber-400" : "fill-gray-200"}`} />
      ))}
    </div>
  );

  return (
    <div className="bg-gradient-to-b from-emerald-50 via-sky-50 to-white min-h-screen">
      <header className="sticky top-0 z-40 backdrop-blur bg-gradient-to-r from-emerald-200 to-sky-200 border-b border-emerald-300/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <motion.h1 initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-emerald-700 via-sky-700 to-cyan-700 bg-clip-text text-transparent">
            Tienda Digital <span className="cursor-pointer" onClick={() => setOpenLogin(true)}>Cedeño</span>
          </motion.h1>
          <div className="flex items-center gap-3">
            <Button onClick={() => setMostrarProveedor((v) => !v)} className="bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:opacity-90 flex items-center gap-2 shadow-md">
              <DollarSign className="size-4" /> {mostrarProveedor ? "Precio Cliente" : "Precio Proveedor"}
            </Button>
            <Sheet open={openCart} onOpenChange={setOpenCart}>
              <SheetTrigger asChild>
                <Button variant="default" className="gap-2 bg-gradient-to-r from-emerald-500 to-sky-500 text-white hover:opacity-90 shadow-md" onClick={() => setOpenCart(true)}>
                  <ShoppingCart className="size-4" />
                  <Badge variant="secondary" className="bg-white/30 text-white">
                    {carrito.reduce((sum, it) => sum + it.cantidad, 0)}
                  </Badge>
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Tu carrito</SheetTitle>
                </SheetHeader>
                <div className="py-4 space-y-3">
                  {carrito.length === 0 ? (
                    <div className="text-sm text-gray-500">Aún no hay productos en el carrito.</div>
                  ) : (
                    <div className="space-y-3">
                      {carrito.map((it) => {
                        const p = productos.find((x) => x.id === it.productId)!;
                        const unit = calcularPrecioPure(p.precio, it.cantidad, mostrarProveedor);
                        const hasDiscount = unit < p.precio;
                        const lineBase = p.precio * it.cantidad;
                        const lineSubtotal = unit * it.cantidad;
                        const lineAhorro = hasDiscount ? lineBase - lineSubtotal : 0;
                        return (
                          <div key={it.productId} className="flex gap-3 items-center">
                            <img src={p.imagenUrl} alt={p.nombre} className="w-16 h-16 object-contain rounded border" />
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <p className="font-medium text-sm">{p.nombre}</p>
                                <button onClick={() => removeItem(it.productId)} className="text-xs text-red-600">Quitar</button>
                              </div>
                              <p className="text-xs text-gray-500">
                                {hasDiscount ? (
                                  <>
                                    <span className="line-through mr-1">${p.precio.toFixed(2)}</span>
                                    <span>${unit.toFixed(2)} c/u</span>
                                    <span className="ml-2 text-amber-600 font-medium">-25%</span>
                                  </>
                                ) : (
                                  <>${unit.toFixed(2)} c/u</>
                                )}
                              </p>
                              <div className="mt-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="outline" onClick={() => decItem(it.productId)}>-1</Button>
                                  <span className="text-sm min-w-8 text-center">{it.cantidad}</span>
                                  <Button size="sm" onClick={() => incItem(it.productId)}>+1</Button>
                                </div>
                                <div className="text-sm font-semibold text-right">
                                  {hasDiscount ? (
                                    <>
                                      <p className="text-gray-500 line-through">${lineBase.toFixed(2)}</p>
                                      <p className="text-emerald-700 font-bold">${lineSubtotal.toFixed(2)}</p>
                                      <p className="text-amber-600 text-xs">Ahorro ${lineAhorro.toFixed(2)}</p>
                                    </>
                                  ) : (
                                    <p>${lineSubtotal.toFixed(2)}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Input placeholder="Cupón de descuento" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} />
                          <Button variant="outline" onClick={() => setAppliedCoupon(coupons.find((c) => c.active && c.code.toLowerCase() === couponInput.trim().toLowerCase()) || null)}>Aplicar</Button>
                          {appliedCoupon && <Badge className="bg-emerald-600 text-white">{appliedCoupon.code} -{appliedCoupon.percent}%</Badge>}
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Subtotal</span>
                          <span>${money(subtotal)}</span>
                        </div>
                        {couponFound && (
                          <div className="flex justify-between text-sm text-amber-700">
                            <span>Cupón ({couponFound.code})</span>
                            <span>-{(subtotal - totalConCupon).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold">
                          <span>Total</span>
                          <span>${money(totalConCupon)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" className="flex-1" onClick={clearCart}>Vaciar</Button>
                        <Button className="flex-1">Pagar</Button>
                      </div>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <section className="border-b bg-gradient-to-r from-white to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar productos…" className="pl-9 border-emerald-200 focus:border-emerald-400" />
          </div>
          <div className="md:col-span-3">
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger className="border-emerald-200 focus:ring-emerald-400">
                <Filter className="size-4 mr-2 text-gray-400" />
                <SelectValue placeholder="Categorías" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((c) => (
                  <SelectItem key={c} value={c}>{c[0]?.toUpperCase() + c.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-3">
            <Select value={orden} onValueChange={setOrden}>
              <SelectTrigger className="border-emerald-200 focus:ring-emerald-400">
                <Tag className="size-4 mr-2 text-gray-400" />
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="precio-asc">Precio: menor a mayor</SelectItem>
                <SelectItem value="precio-desc">Precio: mayor a menor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <main className="min-h-dvh bg-gradient-to-b from-sky-50 via-emerald-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {visibles.map((p) => {
            const esProveedor = mostrarProveedor;
            const precioProv = (p.precio * 0.75).toFixed(2);
            return (
              <Card key={p.id} className="overflow-hidden rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-emerald-100 bg-white">
                <img src={p.imagenUrl} alt={p.nombre} className="aspect-square object-contain w-full h-48 bg-gradient-to-br from-emerald-50 to-sky-50" />
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-emerald-800 line-clamp-1 flex items-center justify-between">
                    {p.nombre}
                    <span className="flex items-center gap-1 text-xs text-gray-600">
                      {estrellas(p.avg)}
                      <span className="ml-1">{p.avg.toFixed(1)} ({p.count})</span>
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 line-clamp-2">{p.descripcion}</p>
                  <div className="mt-2 text-sm font-semibold">
                    {esProveedor ? (
                      <>
                        <span className="line-through mr-2 text-gray-500">${p.precio.toFixed(2)}</span>
                        <span className="text-emerald-700">${precioProv}</span>
                        <span className="ml-2 text-xs text-amber-600">-25%</span>
                      </>
                    ) : (
                      <>${p.precio.toFixed(2)}</>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2 pt-2">
                  <Button className="flex-1 bg-gradient-to-r from-emerald-500 to-sky-500 text-white hover:opacity-90 shadow-sm" onClick={() => addToCart(p.id)}>
                    {mostrarProveedor ? `Agregar ${MIN_PROVEEDOR}` : "Agregar"}
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => abrirComentarios(p.id)}>
                    <MessageSquare className="size-4 text-emerald-600" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </main>

      <Dialog open={!!openComentario} onOpenChange={() => setOpenComentario(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Comentarios</DialogTitle>
          </DialogHeader>
          {openComentario && (() => {
            const current = productos.find((x) => x.id === openComentario);
            if (!current) return <EmptyState title="Sin comentarios" subtitle="Sé el primero en opinar" />;
            return (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {current.comentarios.length === 0 ? (
                  <EmptyState title="Sin comentarios" subtitle="Sé el primero en opinar" />)
                : (
                  current.comentarios
                    .slice()
                    .sort((a, b) => b.date - a.date)
                    .map((c) => (
                      <div key={c.id} className="border rounded-lg p-3 flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{c.user}</span>
                            <span className="text-xs text-gray-500">{new Date(c.date).toLocaleString()}</span>
                            <span className="ml-2">{estrellas(c.rating)}</span>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">{c.text}</p>
                        </div>
                        {isAdmin && (
                          <div className="flex items-center gap-2">
                            <Button size="icon" variant="outline" onClick={() => banearUsuario(c.user)}>
                              <Ban className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="destructive" onClick={() => eliminarComentario(current.id, c.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                )}
              </div>
            );
          })()}
          <Separator />
          <div className="space-y-2">
            <Label>Tu nombre</Label>
            <Input value={nombreUsuario} onChange={(e) => setNombreUsuario(e.target.value)} placeholder="Ingresa tu nombre" />
            <Label>Tu valoración</Label>
            <div className="flex gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className={`w-6 h-6 cursor-pointer ${i < nuevaValoracion ? "fill-amber-400" : "fill-gray-200"}`} onClick={() => setNuevaValoracion(i + 1)} />
              ))}
            </div>
            <Label>Comentario</Label>
            <Input value={nuevoComentario} onChange={(e) => setNuevoComentario(e.target.value)} placeholder="Escribe tu opinión..." />
            {nombreUsuario && bannedUsers.map((b) => b.toLowerCase()).includes(nombreUsuario.toLowerCase()) && (
              <p className="text-xs text-red-600">No puedes comentar.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenComentario(null)}>Cerrar</Button>
            <Button onClick={() => openComentario && agregarComentario(openComentario)} disabled={!!(nombreUsuario && bannedUsers.map((b) => b.toLowerCase()).includes(nombreUsuario.toLowerCase())) || !nuevoComentario.trim()}>Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openLogin} onOpenChange={setOpenLogin}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Acceso administrador</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-1">
              <Label htmlFor="user">Usuario</Label>
              <Input id="user" placeholder="admin" />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="pass">Contraseña</Label>
              <Input id="pass" type="password" placeholder="admin123" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenLogin(false)}>Cancelar</Button>
            <Button onClick={() => { const u = (document.getElementById("user") as HTMLInputElement)?.value; const p = (document.getElementById("pass") as HTMLInputElement)?.value; if (u === "admin" && p === "admin123") { setIsAdmin(true); setOpenLogin(false); setAdminOpen(true); } }}>Entrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={adminOpen} onOpenChange={setAdminOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Panel de Administración</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-6">
            <section className="space-y-2">
              <h3 className="font-semibold">Usuarios baneados</h3>
              <div className="flex flex-wrap gap-2">
                {bannedUsers.length === 0 ? (
                  <p className="text-xs text-gray-500">Aún no hay usuarios baneados.</p>
                ) : (
                  bannedUsers.map((u) => (
                    <Badge key={u} variant="destructive" className="flex items-center gap-1">
                      {u}
                      <Button size="sm" variant="secondary" onClick={() => setBannedUsers((prev) => prev.filter((x) => x !== u))}>Quitar</Button>
                    </Badge>
                  ))
                )}
              </div>
            </section>

            <Separator />

            <section className="space-y-2">
              <h3 className="font-semibold">Cupones</h3>
              <div className="flex gap-2">
                <Input id="coupon-code" placeholder="Código (p.ej. DESC10)" />
                <Input id="coupon-percent" placeholder="%" type="number" min={1} max={90} />
                <Button onClick={() => {
                  const code = (document.getElementById("coupon-code") as HTMLInputElement)?.value?.trim();
                  const percent = Number((document.getElementById("coupon-percent") as HTMLInputElement)?.value);
                  if (!code || !percent) return;
                  setCoupons((prev) => [{ code, percent, active: true }, ...prev]);
                }}>Crear</Button>
              </div>
              <div className="space-y-2">
                {coupons.length === 0 ? (
                  <p className="text-xs text-gray-500">Sin cupones aún.</p>
                ) : (
                  coupons.map((c) => (
                    <div key={c.code} className="flex items-center justify-between rounded border p-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-600 text-white">{c.code}</Badge>
                        <span className="text-sm">{c.percent}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => setCoupons((prev) => prev.map((x) => x.code === c.code ? { ...x, active: !x.active } : x))}>{c.active ? "Desactivar" : "Activar"}</Button>
                        <Button size="sm" variant="destructive" onClick={() => setCoupons((prev) => prev.filter((x) => x.code !== c.code))}>Eliminar</Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <Separator />

            <section className="space-y-2">
              <h3 className="font-semibold">Categorías</h3>
              <div className="flex gap-2">
                <Input id="new-cat" placeholder="Nombre de categoría" />
                <Button onClick={() => {
                  const v = (document.getElementById("new-cat") as HTMLInputElement)?.value?.trim();
                  if (!v) return;
                  setCategoriesExtra((prev) => Array.from(new Set([...(prev ?? []), v.toLowerCase()])));
                }}>Agregar</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {categorias.map((c) => (
                  <Badge key={c} variant="secondary">{c}</Badge>
                ))}
              </div>
            </section>

            <Separator />

            <section className="space-y-2">
              <h3 className="font-semibold">Agregar producto</h3>
              <div className="grid grid-cols-2 gap-2">
                <Input id="p-nombre" placeholder="Nombre" />
                <Input id="p-precio" placeholder="Precio" type="number" step="0.01" />
                <Input id="p-desc" className="col-span-2" placeholder="Descripción" />
                <Input id="p-cat" placeholder="Categoría" />
                <Input id="p-img" className="col-span-2" placeholder="URL de imagen" />
              </div>
              <Button onClick={() => {
                const nombre = (document.getElementById("p-nombre") as HTMLInputElement)?.value?.trim();
                const precio = Number((document.getElementById("p-precio") as HTMLInputElement)?.value);
                const descripcion = (document.getElementById("p-desc") as HTMLInputElement)?.value?.trim();
                const categoria = (document.getElementById("p-cat") as HTMLInputElement)?.value?.trim() || "otros";
                const imagenUrl = (document.getElementById("p-img") as HTMLInputElement)?.value?.trim() || "";
                if (!nombre || !precio) return;
                const id = String(Date.now());
                setProductos((prev) => [{ id, nombre, descripcion: descripcion || "", precio, categoria: categoria.toLowerCase(), imagenUrl, valoraciones: [], comentarios: [] }, ...prev]);
                setCategoriesExtra((prev) => Array.from(new Set([...(prev ?? []), categoria.toLowerCase()])));
              }}>Crear producto</Button>
            </section>

            <Separator />

            <section className="space-y-2">
              <h3 className="font-semibold">Administrar precios</h3>
              <div className="space-y-2 max-h-64 overflow-auto pr-2">
                {productos.map((p) => (
                  <div key={p.id} className="grid grid-cols-5 items-center gap-2 border rounded p-2">
                    <span className="col-span-2 text-sm truncate">{p.nombre}</span>
                    <span className="text-xs text-gray-500">${p.precio.toFixed(2)}</span>
                    <Input id={`price-${p.id}`} type="number" step="0.01" placeholder="Nuevo precio" className="col-span-2" />
                    <div className="col-span-5 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => {
                        const v = Number((document.getElementById(`price-${p.id}`) as HTMLInputElement)?.value);
                        if (!v) return;
                        setProductos((prev) => prev.map((x) => (x.id === p.id ? { ...x, precio: v } : x)));
                      }}>Actualizar</Button>
                      <Button size="sm" variant="destructive" onClick={() => setProductos((prev) => prev.filter((x) => x.id !== p.id))}>Eliminar</Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="pt-2">
              <Button variant="outline" onClick={() => { setIsAdmin(false); setAdminOpen(false); }}>Cerrar sesión</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
