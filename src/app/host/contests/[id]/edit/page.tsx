import EditContestClient from './EditClient';

export default function EditContestPage({params}: {params: {id: string}}) {
  return <EditContestClient id={params.id} />;
}
