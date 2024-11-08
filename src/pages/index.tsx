import { db } from "@/lib/firebase";
import localFont from "next/font/local";
import { useSwipeable } from 'react-swipeable';
import { ChangeEvent, FormEvent, ReactNode, useEffect, useState } from "react";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const COLLECTION_NAME = 'sold';

interface TicketType {
  buyer: string;
  paid: boolean;
  phone: string;
}

interface TicketDto {
  id: string; //solo para guardar
  buyer: string;
  paid?: boolean;
  phone: string;
}

export default function Home() {
  const [loading, setLoading] = useState<boolean>(true);
  const [soldTickets, setSoldTickets] = useState<Array<number>>([]);
  const [tickets, setTickets] = useState<Map<string, TicketType>>(new Map())
  const boletos = Array.from({ length: 100 }, (_, i) => i);
  const [isShowSideBar, showSideBar] = useState(false);

  const handlers = useSwipeable({
    onSwipedLeft: () => showSideBar(false),
    onSwipedRight: () => showSideBar(true),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  });

  useEffect(() => {
    const colRef = collection(db, COLLECTION_NAME);
    const unsub = onSnapshot(colRef, (querySnapshot) => {
      const data: Array<number> = [];
      const data2: Map<string, TicketType> = new Map();
      for (const doc of querySnapshot.docs) {
        data.push(parseInt(doc.id));
        data2.set(doc.id, doc.data() as TicketType);
      }
      setTickets(data2);
      setSoldTickets(data);
      setLoading(false);
    }); 
  
    return unsub;
  }, [loading])

  if(loading) {
    return (
      <div className="absolute min-h-screen w-full flex flex-col justify-center items-center">
        <h1 className="text-2xl text-center">Cargando boletos...</h1>
      </div>
    )
  }
  

  return (
    <main {...handlers} className={`${geistSans.variable} ${geistMono.variable} select-none overflow-hidden flex flex-col justify-center items-center p-2 min-h-screen font-[family-name:var(--font-geist-sans)]`}>
      <ToastContainer />
      <Sidebar open={isShowSideBar}>
        
      </Sidebar>
      <div className="rounded-md border-4 border-[#fdf1b0]">
        <section className="flex justify-center flex-wrap gap-2 rounded-md p-2 border-4 border-[#6a012c] bg-[#fdf1b0]">
          {boletos.map((number) => {
            return <Item sold={soldTickets.includes(number)} key={number}>{number}</Item>
          })}
        </section>
      </div>
      <div className="flex justify-between w-full mt-2">
        <article className="drop-shadow-lg p-2 rounded-xl bg-[#fdf1b0] text-[#6a012c] font-semibold">
          1x3$ y 2x5$
        </article>
        <h3 className="flex flex-col justify-center items-center text-white text-sm drop-shadow-md bg-[#ffffff4b] px-4 rounded">Vendidos: {soldTickets.length} | Restantes: {100 - soldTickets.length}</h3>
      </div>
    </main>
  );
}

function Item({ sold, children }: { sold?: boolean, children: ReactNode }) {
  return (
    <div className="flex flex-col justify-center items-center w-[30px] h-[30px] p-2 border-2 border-[#6a012c] rounded-full text-[#6a012c] font-bold">
      <div className="relative flex flex-col justify-center items-center">
        {sold && <span className="absolute bg-red-500 w-[20px] h-[20px] rounded-full opacity-80" />}
        {children}
      </div>
    </div>
  )
}

const Sidebar = ({ open, children }: { open: boolean, children?: ReactNode }) => {
  const [formData, setFormData] = useState<TicketDto>({ id: '', buyer: '', phone: ''})

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const docRef = doc(db, COLLECTION_NAME, formData.id);
    
    await setDoc(docRef, {
      buyer: formData.buyer,
      phone: formData.phone,
      paid: false
    })

    toast.success(`Numero registrado ${formData.id} a: ${formData.buyer}`, {
      toastId: "ticketAdded"
    });
  }

  function handleOnChangeInput(e: ChangeEvent<HTMLInputElement>) {
    if(!e.target.name || e.target.name.length < 1) {
      console.error('El Input debe tener la propiedad name referenciada al objeto dto!');
      throw new Error("El Input debe tener la propiedad name referenciada al objeto dto!");
    }

    const dataCopy = formData as any;
    dataCopy[e.target.name] = e.target.value;
    setFormData(dataCopy);
  }

  return (
    <div
      className={`fixed top-0 left-0 w-full h-full bg-[#6a012c] text-white transition-transform duration-300 ease-in-out z-50 ${open ? 'transform translate-x-0' : 'transform -translate-x-full'
        }`}
    >
      <div className="flex flex-col h-full justify-between p-4">
        {children}
        <section>
          <h2 className="text-2xl font-bold">Opciones</h2>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="form-control">
              Numero:
              <input required type="number" min={0} max={99} placeholder="Ej: 5" name="id" onChange={handleOnChangeInput} />
            </div>
            <div className="form-control">
              Comprador:
              <input required type="text" maxLength={20} placeholder="Ej: Olindo Guevara" name="buyer" onChange={handleOnChangeInput} />
            </div>
            <div className="form-control">
              Numero Tlf(opcional):
              <input type="text" maxLength={11} placeholder="Ej: 04141234567" name="phone" onChange={handleOnChangeInput} />
            </div>
            <div className="flex flex-row justify-between">
              <button type="reset">Limpiar</button>
              <button type="submit">Vender</button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

