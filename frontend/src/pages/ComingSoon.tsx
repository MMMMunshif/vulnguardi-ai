type ComingSoonProps = {
    title: string;
    description: string;
  };
  
  function ComingSoon({ title, description }: ComingSoonProps) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-slate-400 mt-2">{description}</p>
  
        <div className="mt-8 rounded-lg border border-dashed border-slate-700 p-8 text-center text-slate-400">
          This frontend page will be connected to backend CRUD APIs next.
        </div>
      </div>
    );
  }
  
  export default ComingSoon;